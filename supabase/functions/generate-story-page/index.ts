import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerationRequest {
  storyId: string;
  pageNumber: number;
  analysis: any;
  artStyle: string;
  characterSheet?: string;
  styleBible?: any;
}

interface StylePresets {
  [key: string]: {
    name: string;
    prompt: string;
    description: string;
  };
}

const STYLE_PRESETS: StylePresets = {
  classic_watercolor: {
    name: "Classic Watercolor",
    prompt: "watercolor illustration style, soft flowing colors, gentle washes, children's book art, warm and inviting",
    description: "Soft, flowing watercolor technique with gentle color washes"
  },
  vibrant_cartoon: {
    name: "Vibrant Cartoon",
    prompt: "bright cartoon illustration, bold colors, simple shapes, friendly characters, clean line art",
    description: "Bold, colorful cartoon style with clean lines"
  },
  pencil_sketch: {
    name: "Pencil Sketch",
    prompt: "pencil sketch illustration, soft graphite shading, artistic hatching, children's book style",
    description: "Gentle pencil sketch with artistic shading"
  },
  digital_painting: {
    name: "Digital Painting",
    prompt: "digital painting illustration, rich colors, painterly brushstrokes, children's book art",
    description: "Rich digital painting with painterly textures"
  }
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[GENERATE] Starting page generation...');
    
    // Get OpenAI API key
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request
    const { 
      storyId, 
      pageNumber, 
      analysis, 
      artStyle, 
      characterSheet, 
      styleBible 
    }: GenerationRequest = await req.json();

    console.log('[GENERATE] Processing page', pageNumber, 'for story', storyId);

    // Get style preset
    const stylePreset = STYLE_PRESETS[artStyle] || STYLE_PRESETS.classic_watercolor;
    
    // Build character consistency prompt
    let characterPrompt = '';
    if (characterSheet && pageNumber > 1) {
      characterPrompt = `
CHARACTER CONSISTENCY (LOCKED - must be obeyed):
Reference this character sheet: ${characterSheet}
Maintain exact character appearance, hair color, clothing details, and facial features.
`;
    }

    // Build style bible prompt
    let styleBiblePrompt = '';
    if (styleBible && Object.keys(styleBible).length > 0) {
      styleBiblePrompt = `
STYLE BIBLE (locked elements must be obeyed):
${JSON.stringify(styleBible, null, 2)}
Keep color palette and artistic style consistent with previous pages.
`;
    }

    // Prepare final text with confidence-based handling
    let finalText = analysis.handwriting_text || '';
    const confidence = analysis.ocr_confidence || 0;
    
    if (confidence < 0.6) {
      finalText = `[Low OCR confidence] ${finalText}`;
    }

    // Build comprehensive generation prompt
    const generationPrompt = `ROLE: Professional children's book illustrator

STYLE PRESET: ${stylePreset.name}
${stylePreset.prompt}

${styleBiblePrompt}

${characterPrompt}

PAGE TEXT (preserve and integrate naturally):
"${finalText}"

SCENE ANALYSIS:
Characters: ${JSON.stringify(analysis.scene?.characters || [])}
Objects: ${analysis.scene?.objects?.join(', ') || 'none specified'}
Setting: ${analysis.scene?.setting || 'unspecified'}
Layout: ${analysis.scene?.layout || 'open composition'}

COLOR PALETTE (reference from original):
${analysis.palette?.join(', ') || 'warm, child-friendly colors'}

HARD RULES:
1. Transform the child's drawing into professional illustration while preserving the essence
2. Keep ALL character traits consistent with previous pages (if character sheet exists)
3. Place text naturally in the illustration (caption area or speech bubbles)
4. Maintain ${stylePreset.name} artistic style throughout
5. Use child-appropriate, warm color palette
6. Create engaging, storybook-quality illustration
7. Preserve the original story intent and emotional tone

QUALITY: Create a publication-ready children's book illustration that captures the magic of the original drawing while maintaining professional artistic standards.

SIZE: Create in portrait orientation suitable for children's book page layout.`;

    console.log('[GENERATE] Built generation prompt (length:', generationPrompt.length, ')');

    // Call GPT-Image-1 for generation
    console.log('[GENERATE] Calling GPT-Image-1 for image generation...');
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-image-1',
        prompt: generationPrompt,
        n: 1,
        size: '1024x1536',
        quality: 'high',
        output_format: 'png'
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[GENERATE] GPT-Image-1 API error:', response.status, errorText);
      throw new Error(`GPT-Image-1 API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    if (!data.data || !data.data[0]) {
      throw new Error('No image data returned from GPT-Image-1');
    }

    const generatedImageB64 = data.data[0].b64_json;
    if (!generatedImageB64) {
      throw new Error('No base64 image data in GPT-Image-1 response');
    }

    console.log('[GENERATE] Image generated successfully, uploading to storage...');

    // Convert base64 to blob for storage
    const imageBuffer = Uint8Array.from(atob(generatedImageB64), c => c.charCodeAt(0));
    const imageBlob = new Blob([imageBuffer], { type: 'image/png' });

    // Upload generated image to storage
    const timestamp = Date.now();
    const generatedPath = `generated/${storyId}/page_${pageNumber}_${timestamp}.png`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('story-images')
      .upload(generatedPath, imageBlob, {
        contentType: 'image/png',
        upsert: false
      });

    if (uploadError) {
      console.error('[GENERATE] Upload error:', uploadError);
      throw uploadError;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('story-images')
      .getPublicUrl(generatedPath);

    const generatedImageUrl = urlData.publicUrl;

    console.log('[GENERATE] Image uploaded successfully:', generatedImageUrl);

    return new Response(JSON.stringify({
      success: true,
      generatedImageUrl,
      pageNumber,
      storyId,
      style: stylePreset.name,
      textProcessed: finalText,
      ocrConfidence: confidence
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[GENERATE] Error:', error);
    return new Response(JSON.stringify({
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});