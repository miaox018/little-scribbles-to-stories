
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { corsHeaders } from '../transform-story/config.ts';
import { processStoryPage } from '../transform-story/story-processor.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { storyId, pageNumber, artStyle = 'classic_watercolor' } = await req.json();

    console.log(`Regenerating page ${pageNumber} for story ${storyId}`);

    // Get the story and original image data
    const { data: story, error: storyError } = await supabase
      .from('stories')
      .select('user_id')
      .eq('id', storyId)
      .single();

    if (storyError || !story) {
      throw new Error('Story not found');
    }

    // Get the original page data
    const { data: pageData, error: pageError } = await supabase
      .from('story_pages')
      .select('original_image_url')
      .eq('story_id', storyId)
      .eq('page_number', pageNumber)
      .single();

    if (pageError || !pageData?.original_image_url) {
      throw new Error('Original page image not found');
    }

    // Convert the stored image URL to data URL for processing
    const imageResponse = await fetch(pageData.original_image_url);
    const imageBlob = await imageResponse.blob();
    const imageDataUrl = `data:${imageBlob.type};base64,${btoa(String.fromCharCode(...new Uint8Array(await imageBlob.arrayBuffer())))}`;

    // Delete the existing failed page record
    await supabase
      .from('story_pages')
      .delete()
      .eq('story_id', storyId)
      .eq('page_number', pageNumber);

    // Process the page again
    const artStylePrompts = {
      classic_watercolor: "Transform this into a beautiful children's book illustration with soft watercolor style, warm colors, and gentle brushstrokes. Maintain the same characters and scene but enhance with artistic flair suitable for ages 3-8.",
      modern_digital: "Create a vibrant, modern digital illustration perfect for children's books with clean lines, bright colors, and contemporary art style.",
      vintage_storybook: "Transform into a classic vintage storybook illustration with timeless charm, soft edges, and traditional children's book aesthetics."
    };

    const stylePrompt = artStylePrompts[artStyle as keyof typeof artStylePrompts] || artStylePrompts.classic_watercolor;

    await processStoryPage({
      imageData: { url: pageData.original_image_url, dataUrl: imageDataUrl },
      pageNumber,
      storyId,
      userId: story.user_id,
      stylePrompt,
      characterDescriptions: "",
      artStyleGuidelines: "",
      supabase
    });

    console.log(`Successfully regenerated page ${pageNumber} for story ${storyId}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Page ${pageNumber} regenerated successfully`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in regenerate-page function:', error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
