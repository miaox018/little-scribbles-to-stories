
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { corsHeaders, artStylePrompts } from './config.ts';
import { processStoryPage } from './story-processor.ts';
import type { ImageData } from './types.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { storyId, images, artStyle = 'classic_watercolor' } = await req.json();

    console.log(`Processing story ${storyId} with ${images.length} images in ${artStyle} style`);

    // Validate that we have images to process
    if (!images || images.length === 0) {
      throw new Error('No images provided for processing');
    }

    // Get the user ID from the story
    const { data: storyData, error: storyError } = await supabase
      .from('stories')
      .select('user_id')
      .eq('id', storyId)
      .single();

    if (storyError || !storyData) {
      throw new Error('Story not found');
    }

    const userId = storyData.user_id;

    // Update story status to processing with exact page count
    await supabase
      .from('stories')
      .update({ 
        status: 'processing',
        total_pages: images.length
      })
      .eq('id', storyId);

    // Get art style prompt
    const stylePrompt = artStylePrompts[artStyle as keyof typeof artStylePrompts] || artStylePrompts.classic_watercolor;

    let characterDescriptions = "";
    let artStyleGuidelines = "";
    let successfulPages = 0;
    let failedPages = 0;

    // Process each image with delays between API calls
    for (let i = 0; i < images.length; i++) {
      try {
        console.log(`Processing page ${i + 1} of ${images.length}`);
        
        // Check if story was cancelled before processing each page
        const { data: currentStory } = await supabase
          .from('stories')
          .select('status')
          .eq('id', storyId)
          .single();

        if (currentStory?.status === 'cancelled') {
          console.log(`Story ${storyId} was cancelled, stopping processing`);
          return new Response(
            JSON.stringify({ success: false, message: 'Story transformation was cancelled' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        const result = await processStoryPage({
          imageData: images[i], 
          pageNumber: i + 1, 
          storyId, 
          userId,
          stylePrompt,
          characterDescriptions,
          artStyleGuidelines,
          supabase
        });

        // Update context for next pages (extract from first page to maintain consistency)
        if (i === 0) {
          characterDescriptions = `- Character designs and appearances established in page 1
- Clothing styles and color schemes from page 1`;
          artStyleGuidelines = `- Art style: ${stylePrompt}
- Visual language and composition style from page 1
- Text typography and placement style from page 1
- Portrait orientation with 3:4 aspect ratio and safe margins`;
        }

        successfulPages++;
        console.log(`Completed page ${i + 1} of ${images.length} with ${artStyle} style`);

        // Add delay between API calls to avoid rate limiting (except for last page)
        if (i < images.length - 1) {
          console.log('Adding delay between API calls...');
          await new Promise(resolve => setTimeout(resolve, 3000)); // 3 second delay
        }

      } catch (error) {
        console.error(`Error processing page ${i + 1}:`, error);
        failedPages++;
        
        // Create a failed page record so user can retry
        await supabase
          .from('story_pages')
          .insert({
            story_id: storyId,
            page_number: i + 1,
            original_image_url: null,
            generated_image_url: null,
            enhanced_prompt: null,
            transformation_status: 'failed'
          });

        if (error.message === 'Story transformation was cancelled') {
          console.log(`Story ${storyId} was cancelled, stopping processing`);
          return new Response(
            JSON.stringify({ success: false, message: 'Story transformation was cancelled' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        // Continue processing other pages even if one fails
        continue;
      }
    }

    // Update story status - completed if all pages succeeded, partial if some failed
    const finalStatus = failedPages > 0 ? 'partial' : 'completed';
    await supabase
      .from('stories')
      .update({ 
        status: finalStatus,
        total_pages: images.length
      })
      .eq('id', storyId);

    console.log(`Story ${storyId} transformation finished: ${successfulPages} successful, ${failedPages} failed pages`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Story transformation completed: ${successfulPages} successful, ${failedPages} failed pages`,
        pages_processed: successfulPages,
        pages_failed: failedPages
      }),
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
