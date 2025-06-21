
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

    // Process each image
    for (let i = 0; i < images.length; i++) {
      const imageData = images[i];
      
      console.log(`Processing page ${i + 1}`);

      // Analyze the image with OpenAI Vision
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
              role: 'system',
              content: 'You are an expert at analyzing children\'s hand-drawn story illustrations. Describe what you see in detail, including characters, actions, setting, and emotions. Focus on story elements that would help create a professional illustration.'
            },
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: 'Analyze this hand-drawn story page and describe what you see. Focus on the story elements, characters, setting, and action happening.'
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
          max_tokens: 500
        }),
      });

      const visionData = await visionResponse.json();
      const description = visionData.choices[0].message.content;

      // Create enhanced prompt for DALL-E
      const enhancedPrompt = `Professional children's book illustration: ${description}. Style: colorful, friendly, child-appropriate, high-quality digital art, detailed but not scary.`;

      console.log(`Generated prompt for page ${i + 1}: ${enhancedPrompt}`);

      // Generate enhanced image with DALL-E
      const dalleResponse = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt: enhancedPrompt,
          size: '1024x1024',
          quality: 'standard',
          n: 1
        }),
      });

      const dalleData = await dalleResponse.json();
      const generatedImageUrl = dalleData.data[0].url;

      // Create story page record
      await supabase
        .from('story_pages')
        .insert({
          story_id: storyId,
          page_number: i + 1,
          original_image_url: imageData.url,
          generated_image_url: generatedImageUrl,
          enhanced_prompt: enhancedPrompt,
          transformation_status: 'completed'
        });

      console.log(`Completed page ${i + 1}`);
    }

    // Update story status to completed
    await supabase
      .from('stories')
      .update({ 
        status: 'completed',
        total_pages: images.length
      })
      .eq('id', storyId);

    console.log(`Story ${storyId} transformation completed`);

    return new Response(
      JSON.stringify({ success: true, message: 'Story transformation completed' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in transform-story function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
