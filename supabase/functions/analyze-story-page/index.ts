import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AnalysisRequest {
  imageUrl: string;
  pageNumber: number;
  storyId: string;
}

interface AnalysisResponse {
  handwriting_text: string;
  scene: {
    characters: Array<{
      name?: string;
      description: string;
      clothing?: string;
      position?: string;
    }>;
    objects: string[];
    layout: string;
    setting?: string;
  };
  palette: string[];
  style_notes: string;
  safety_flags: string[];
  ocr_confidence: number;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[ANALYZE] Starting page analysis...');
    
    // Get OpenAI API key
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    // Parse request
    const { imageUrl, pageNumber, storyId }: AnalysisRequest = await req.json();
    console.log('[ANALYZE] Processing page', pageNumber, 'for story', storyId);

    // Validate input
    if (!imageUrl || !pageNumber || !storyId) {
      throw new Error('Missing required fields: imageUrl, pageNumber, storyId');
    }

    // GPT-4o Vision analysis prompt
    const systemPrompt = `Analyze a child's drawing for an illustrator. Be concise, multilingual OCR.
Return JSON only with this exact schema:
{
  "handwriting_text": "extracted text from the image",
  "scene": {
    "characters": [{"name": "optional", "description": "appearance", "clothing": "what they wear", "position": "where in image"}],
    "objects": ["list", "of", "objects"],
    "layout": "composition description",
    "setting": "background/environment"
  },
  "palette": ["#AABBCC", "#DDEEFF"],
  "style_notes": "drawing style, technique notes",
  "safety_flags": ["any concerns"]
}

Focus on:
- Extracting ALL visible text (handwriting and print)
- Character appearance details for consistency
- Color palette from the actual drawing
- Layout and composition
- Any safety concerns`;

    const userPrompt = `Analyze this child's drawing page ${pageNumber}. Extract text with high accuracy and describe visual elements for illustration consistency.`;

    // Call GPT-4o with vision
    console.log('[ANALYZE] Calling GPT-4o for analysis...');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: userPrompt
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageUrl,
                  detail: 'high'
                }
              }
            ]
          }
        ],
        max_tokens: 2000,
        temperature: 0.1
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[ANALYZE] GPT-4o API error:', response.status, errorText);
      throw new Error(`GPT-4o API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const analysisText = data.choices[0].message.content;
    
    console.log('[ANALYZE] GPT-4o response received:', analysisText.substring(0, 200) + '...');

    // Parse the JSON response
    let analysisResult: AnalysisResponse;
    try {
      // Clean up the response to extract JSON
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in GPT-4o response');
      }
      
      analysisResult = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error('[ANALYZE] Failed to parse GPT-4o JSON:', parseError);
      console.error('[ANALYZE] Raw response:', analysisText);
      
      // Fallback parsing
      analysisResult = {
        handwriting_text: analysisText.includes('text') ? 'Text detected but parsing failed' : '',
        scene: {
          characters: [{ description: 'Character detected but parsing failed' }],
          objects: ['objects detected'],
          layout: 'Layout analysis failed',
          setting: 'Setting analysis failed'
        },
        palette: ['#000000', '#FFFFFF'],
        style_notes: 'Style analysis failed - parsing error',
        safety_flags: [],
        ocr_confidence: 0.3
      };
    }

    // Calculate OCR confidence based on text extraction quality
    const textLength = analysisResult.handwriting_text.length;
    const hasIllegibleMarkers = analysisResult.handwriting_text.includes('[illegible]') || 
                               analysisResult.handwriting_text.includes('[unclear]');
    
    let ocrConfidence = 0.8; // Default confidence
    if (textLength === 0) {
      ocrConfidence = 0.0;
    } else if (hasIllegibleMarkers) {
      ocrConfidence = 0.5;
    } else if (textLength < 10) {
      ocrConfidence = 0.6;
    }
    
    analysisResult.ocr_confidence = ocrConfidence;

    console.log('[ANALYZE] Analysis completed successfully');
    console.log('[ANALYZE] OCR confidence:', ocrConfidence);
    console.log('[ANALYZE] Text extracted:', analysisResult.handwriting_text.substring(0, 100));

    return new Response(JSON.stringify({
      success: true,
      analysis: analysisResult,
      pageNumber,
      storyId
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[ANALYZE] Error:', error);
    return new Response(JSON.stringify({
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});