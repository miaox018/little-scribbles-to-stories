
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Art style prompts mapping
const artStylePrompts = {
  classic_watercolor: "Classic watercolor painting style with soft, flowing colors and gentle brush strokes. Use pastel tones and dreamy, ethereal quality typical of children's watercolor storybooks.",
  disney_animation: "Disney-style animation with bright, vibrant colors and smooth cartoon aesthetics. Characters should have expressive features and the overall style should be cheerful and magical like classic Disney animated films.",
  realistic_digital: "High-quality realistic digital art with detailed textures and lifelike proportions. Use professional digital illustration techniques with rich colors and fine details suitable for premium children's books.",
  manga_anime: "Japanese manga/anime art style with expressive characters, dynamic poses, and characteristic facial features. Use bright colors and stylized proportions typical of anime illustrations.",
  vintage_storybook: "Classic vintage storybook illustration style reminiscent of 1950s children's books. Use warm, nostalgic colors and traditional illustration techniques with a timeless, cozy feeling."
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { storyId, images, artStyle = 'classic_watercolor' } = await req.json();

    console.log(`Processing story ${storyId} with ${images.length} images in ${artStyle} style`);

    // Update story status to processing
    await supabase
      .from('stories')
      .update({ status: 'processing' })
      .eq('id', storyId);

    // Get art style prompt
    const stylePrompt = artStylePrompts[artStyle as keyof typeof artStylePrompts] || artStylePrompts.classic_watercolor;

    let storyContext = "";
    let characterDescriptions = "";
    let artStyleGuidelines = "";
    const generatedPages: string[] = [];

    // Process each image with GPT-4o (vision model)
    for (let i = 0; i < images.length; i++) {
      const imageData = images[i];
      
      // Check if story was cancelled
      const { data: story } = await supabase
        .from('stories')
        .select('status')
        .eq('id', storyId)
        .single();

      if (story?.status === 'cancelled') {
        console.log(`Story ${storyId} was cancelled, stopping processing`);
        return new Response(
          JSON.stringify({ success: false, message: 'Story transformation was cancelled' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      console.log(`Processing page ${i + 1} with ${artStyle} style and story context`);

      // Build context from previous pages for consistency
      let contextPrompt = "";
      if (i === 0) {
        // First page - establish the story context and style
        contextPrompt = `This is PAGE 1 of a children's story book. ESTABLISH the character designs, art style, and story world that will be consistent throughout all pages. Use the following art style: ${stylePrompt}`;
      } else {
        // Subsequent pages - maintain consistency
        contextPrompt = `This is PAGE ${i + 1} of the same children's story book. MAINTAIN CONSISTENCY with the established:
${characterDescriptions}
${artStyleGuidelines}

Use the following art style: ${stylePrompt}

Previous pages in this story have been generated with these visual elements. Ensure the same characters, art style, and story world continue seamlessly.`;
      }

      const prompt = `${contextPrompt}

Transform this child's hand-drawn story page into a professional children's book illustration with CLEAR, READABLE TEXT.

CRITICAL TEXT REQUIREMENTS:
- Use clean, simple, easy-to-read fonts (similar to Times New Roman, Arial, or classic children's book fonts)
- Text should be sharp, clear, and perfectly legible
- NO decorative, stylized, or fancy fonts
- NO text effects, shadows, or distortions
- Text should look like it was typeset in a professional children's book
- Ensure high contrast between text and background
- Text should be large enough for children to read easily

VISUAL REFERENCE ANALYSIS:
Carefully analyze the provided child's drawing to understand:
- Character appearances and clothing
- Setting and background elements
- Any text or dialogue present
- Story events happening on this page
- Emotional tone and mood

Style requirements:
- ${stylePrompt}
- Child-appropriate and friendly
- High detail but not scary or overwhelming
- Maintain the story elements and characters from the original drawing
- Make it magical and enchanting while staying true to the child's vision
- MOST IMPORTANT: Any text in the image must be crystal clear and easily readable
- CONSISTENCY: If this is not the first page, maintain the same character designs, art style, and visual language established in previous pages`;

      // Use GPT-4o with vision to analyze the image and generate description first
      const visionResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: prompt
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: imageData.dataUrl
                  }
                }
              ]
            }
          ],
          max_tokens: 1000
        }),
      });

      if (!visionResponse.ok) {
        const errorText = await visionResponse.text();
        console.error(`Vision API error for page ${i + 1}:`, errorText);
        throw new Error(`Vision API failed for page ${i + 1}: ${errorText}`);
      }

      const visionData = await visionResponse.json();
      const analysisText = visionData.choices[0].message.content;

      console.log(`Generated analysis for page ${i + 1}:`, analysisText);

      // Now use DALL-E 3 to generate the image based on the analysis
      const imageResponse = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt: analysisText,
          size: '1024x1024',
          quality: 'hd',
          response_format: 'b64_json',
          n: 1
        }),
      });

      if (!imageResponse.ok) {
        const errorText = await imageResponse.text();
        console.error(`Image generation error for page ${i + 1}:`, errorText);
        throw new Error(`Image generation failed for page ${i + 1}: ${errorText}`);
      }

      const imageData_response = await imageResponse.json();
      
      if (!imageData_response.data || !imageData_response.data[0]) {
        throw new Error(`No image data returned for page ${i + 1}`);
      }

      // Convert base64 to blob for storage
      const base64Image = imageData_response.data[0].b64_json;
      const imageBlob = new Blob([Uint8Array.from(atob(base64Image), c => c.charCodeAt(0))], { type: 'image/png' });
      
      // Upload generated image to Supabase Storage
      const fileName = `generated/${storyId}/page_${i + 1}_${Date.now()}.png`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('story-images')
        .upload(fileName, imageBlob);

      if (uploadError) {
        console.error(`Storage upload error for page ${i + 1}:`, uploadError);
        throw uploadError;
      }

      const { data: urlData } = supabase.storage
        .from('story-images')
        .getPublicUrl(fileName);

      const generatedImageUrl = urlData.publicUrl;
      generatedPages.push(generatedImageUrl);

      // Create story page record
      await supabase
        .from('story_pages')
        .insert({
          story_id: storyId,
          page_number: i + 1,
          original_image_url: imageData.url,
          generated_image_url: generatedImageUrl,
          enhanced_prompt: analysisText,
          transformation_status: 'completed'
        });

      // Update context for next pages (extract from first page to maintain consistency)
      if (i === 0) {
        characterDescriptions = `- Character designs and appearances established in page 1
- Clothing styles and color schemes from page 1`;
        artStyleGuidelines = `- Art style: ${stylePrompt}
- Visual language and composition style from page 1
- Text typography and placement style from page 1`;
      }

      console.log(`Completed page ${i + 1} with ${artStyle} style and story context`);
    }

    // Update story status to completed
    await supabase
      .from('stories')
      .update({ 
        status: 'completed',
        total_pages: images.length
      })
      .eq('id', storyId);

    console.log(`Story ${storyId} transformation completed with ${artStyle} style and story consistency`);

    return new Response(
      JSON.stringify({ success: true, message: `Story transformation completed with ${artStyle} style and story consistency` }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in transform-story function:', error);
    
    // Try to update story status to failed for better error tracking
    try {
      const { storyId } = await req.json().catch(() => ({}));
      if (storyId) {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        await supabase
          .from('stories')
          .update({ status: 'failed' })
          .eq('id', storyId);
      }
    } catch (updateError) {
      console.error('Failed to update story status to failed:', updateError);
    }
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
