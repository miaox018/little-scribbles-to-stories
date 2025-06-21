
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { storyId, images } = await req.json();

    console.log(`Processing story ${storyId} with ${images.length} images`);

    // Update story status to processing
    await supabase
      .from('stories')
      .update({ status: 'processing' })
      .eq('id', storyId);

    // Process each image with GPT-Image-1
    for (let i = 0; i < images.length; i++) {
      const imageData = images[i];
      
      console.log(`Processing page ${i + 1} with GPT-Image-1`);

      // Updated prompt for clearer, more readable text
      const prompt = `Transform this child's hand-drawn story page into a professional children's book illustration with CLEAR, READABLE TEXT.

CRITICAL TEXT REQUIREMENTS:
- Use clean, simple, easy-to-read fonts (similar to Times New Roman, Arial, or classic children's book fonts)
- Text should be sharp, clear, and perfectly legible
- NO decorative, stylized, or fancy fonts
- NO text effects, shadows, or distortions
- Text should look like it was typeset in a professional children's book
- Ensure high contrast between text and background
- Text should be large enough for children to read easily

Analyze the drawing and understand the story elements, characters, setting, and emotions, then create a beautiful, colorful, child-friendly illustration that captures the essence of the original while making it professional and engaging.

Style requirements:
- Professional children's book illustration style
- Bright, vibrant colors
- Child-appropriate and friendly
- High detail but not scary or overwhelming
- Maintain the story elements and characters from the original drawing
- Make it magical and enchanting while staying true to the child's vision
- MOST IMPORTANT: Any text in the image must be crystal clear and easily readable`;

      const imageResponse = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-image-1',
          prompt: prompt,
          size: '1024x1024',
          quality: 'high',
          response_format: 'b64_json',
          n: 1
        }),
      });

      const imageData_response = await imageResponse.json();
      
      if (!imageData_response.data || !imageData_response.data[0]) {
        throw new Error(`Failed to generate image for page ${i + 1}`);
      }

      // Convert base64 to blob URL for storage
      const base64Image = imageData_response.data[0].b64_json;
      const imageBlob = new Blob([Uint8Array.from(atob(base64Image), c => c.charCodeAt(0))], { type: 'image/png' });
      
      // Upload generated image to Supabase Storage
      const fileName = `generated/${storyId}/page_${i + 1}_${Date.now()}.png`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('story-images')
        .upload(fileName, imageBlob);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('story-images')
        .getPublicUrl(fileName);

      const generatedImageUrl = urlData.publicUrl;

      // Create story page record
      await supabase
        .from('story_pages')
        .insert({
          story_id: storyId,
          page_number: i + 1,
          original_image_url: imageData.url,
          generated_image_url: generatedImageUrl,
          enhanced_prompt: prompt,
          transformation_status: 'completed'
        });

      console.log(`Completed page ${i + 1} with improved text clarity`);
    }

    // Update story status to completed
    await supabase
      .from('stories')
      .update({ 
        status: 'completed',
        total_pages: images.length
      })
      .eq('id', storyId);

    console.log(`Story ${storyId} transformation completed with improved text clarity`);

    return new Response(
      JSON.stringify({ success: true, message: 'Story transformation completed with improved text clarity' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in transform-story function:', error);
    
    // Try to update story status to failed for better error tracking
    try {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      const { storyId } = await req.json();
      await supabase
        .from('stories')
        .update({ status: 'failed' })
        .eq('id', storyId);
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
