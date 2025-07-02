
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { artStylePrompts } from './config.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
import { processStoryPage } from './story-processor.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Background processing function (no timeout limits)
async function processStoryAsync(storyId: string, imageUrls: any[], artStyle: string, userId: string) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  console.log(`[ASYNC] Starting background processing for story ${storyId} with ${imageUrls.length} images`);
  
  try {
    // Get art style prompt
    const stylePrompt = artStylePrompts[artStyle as keyof typeof artStylePrompts] || artStylePrompts.classic_watercolor;

    let characterDescriptions = "";
    let artStyleGuidelines = "";
    let successfulPages = 0;
    let failedPages = 0;

    // Process each image with proper delays
    for (let i = 0; i < imageUrls.length; i++) {
      try {
        // Check if story was cancelled
        const { data: story } = await supabase
          .from('stories')
          .select('status')
          .eq('id', storyId)
          .single();

        if (story?.status === 'cancelled') {
          console.log(`[ASYNC] Story ${storyId} was cancelled, stopping processing`);
          return;
        }

        // Update progress in database
        const progressPercent = Math.round((i / imageUrls.length) * 100);
        await supabase
          .from('stories')
          .update({ 
            status: 'processing',
            description: `Processing page ${i + 1} of ${imageUrls.length} (${progressPercent}%)`
          })
          .eq('id', storyId);

        console.log(`[ASYNC] Processing page ${i + 1} of ${imageUrls.length}`);
        
        const result = await processStoryPage({
          imageData: imageUrls[i], 
          pageNumber: i + 1, 
          storyId, 
          userId,
          stylePrompt,
          characterDescriptions,
          artStyleGuidelines,
          supabase
        });

        successfulPages++;

        // Update context for next pages
        if (i === 0) {
          characterDescriptions = `- Character designs and appearances established in page 1
- Clothing styles and color schemes from page 1`;
          artStyleGuidelines = `- Art style: ${stylePrompt}
- Visual language and composition style from page 1
- Text typography and placement style from page 1
- Portrait orientation (3:4 aspect ratio) with safe margins`;
        }

        console.log(`[ASYNC] Completed page ${i + 1} of ${imageUrls.length}`);
      } catch (error) {
        if (error.message === 'Story transformation was cancelled') {
          console.log(`[ASYNC] Story ${storyId} was cancelled, stopping processing`);
          return;
        }
        
        console.error(`[ASYNC] Failed to process page ${i + 1}:`, error);
        failedPages++;
      }

      // Add delay between pages (except after the last page)
      if (i < imageUrls.length - 1) {
        const delayMs = 8000; // 8 seconds between pages
        console.log(`[ASYNC] Waiting ${delayMs}ms before processing next page...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }

    // Determine final status
    let finalStatus = 'completed';
    if (failedPages > 0 && successfulPages > 0) {
      finalStatus = 'partial';
    } else if (successfulPages === 0) {
      finalStatus = 'failed';
    }

    // Update final story status
    console.log(`[ASYNC] Story ${storyId} transformation completed: ${successfulPages} successful, ${failedPages} failed pages`);
    await supabase
      .from('stories')
      .update({ 
        status: finalStatus,
        total_pages: imageUrls.length,
        description: finalStatus === 'completed' 
          ? `Story completed with ${successfulPages} pages` 
          : finalStatus === 'partial'
          ? `Story partially completed: ${successfulPages} successful, ${failedPages} failed pages`
          : `Story processing failed: ${failedPages} pages failed`
      })
      .eq('id', storyId);

  } catch (error) {
    console.error(`[ASYNC] Error in background processing for story ${storyId}:`, error);
    
    // Update story status to failed
    await supabase
      .from('stories')
      .update({ 
        status: 'failed',
        description: `Processing failed: ${error.message}`
      })
      .eq('id', storyId);
  }
}

serve(async (req) => {
  console.log('=== EDGE FUNCTION START ===');
  console.log('Request URL:', req.url);
  console.log('Request method:', req.method);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    console.log('Request headers:', Object.fromEntries(req.headers.entries()));
    
    // Get the raw request body
    console.log('Reading request body...');
    const bodyText = await req.text();
    console.log('Raw body received - length:', bodyText.length);
    console.log('Raw body first 500 chars:', bodyText.substring(0, 500));
    
    // Check if body is empty or invalid
    if (!bodyText || bodyText.trim() === '') {
      console.error('ERROR: Empty request body received');
      return new Response(
        JSON.stringify({ 
          error: 'Empty request body', 
          received_length: bodyText?.length || 0,
          received_content: bodyText || 'null'
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Try to parse JSON
    let requestBody;
    try {
      console.log('Attempting to parse JSON...');
      requestBody = JSON.parse(bodyText);
      console.log('JSON parsed successfully');
      console.log('Request body keys:', Object.keys(requestBody));
      console.log('Request body structure:', {
        storyId: requestBody.storyId ? 'present' : 'missing',
        imageUrls: requestBody.imageUrls ? `array of ${requestBody.imageUrls.length}` : 'missing',
        artStyle: requestBody.artStyle || 'missing'
      });
    } catch (parseError) {
      console.error('JSON parsing failed:', parseError);
      console.error('Parse error details:', parseError.message);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid JSON in request body', 
          details: parseError.message,
          received_body: bodyText.substring(0, 1000)
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    const { storyId, imageUrls, artStyle = 'classic_watercolor' } = requestBody;

    console.log(`Processing story ${storyId} with ${imageUrls?.length || 0} image URLs in ${artStyle} style`);

    // Validate required fields
    if (!storyId) {
      console.error('ERROR: Missing storyId');
      return new Response(
        JSON.stringify({ error: 'Missing storyId in request body' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
      console.error('ERROR: Invalid or missing imageUrls array');
      return new Response(
        JSON.stringify({ 
          error: 'Invalid or missing imageUrls array', 
          received_imageUrls: imageUrls ? `type: ${typeof imageUrls}, length: ${imageUrls.length}` : 'null'
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get the user ID from the story
    console.log('Fetching story data...');
    const { data: storyData, error: storyError } = await supabase
      .from('stories')
      .select('user_id, status')
      .eq('id', storyId)
      .single();

    if (storyError || !storyData) {
      console.error('Story fetch error:', storyError);
      return new Response(
        JSON.stringify({ error: 'Story not found', details: storyError?.message }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Check if story is already cancelled
    if (storyData.status === 'cancelled') {
      console.log('Story is already cancelled, aborting processing');
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Story processing was cancelled before it could start' 
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const userId = storyData.user_id;
    console.log('Found story for user:', userId);

    // HYBRID PROCESSING LOGIC
    const SYNC_THRESHOLD = 3; // Process ≤3 images synchronously, >3 asynchronously
    
    if (imageUrls.length <= SYNC_THRESHOLD) {
      console.log(`[SYNC] Processing ${imageUrls.length} images synchronously`);
      
      // Update story status to processing
      await supabase
        .from('stories')
        .update({ 
          status: 'processing',
          total_pages: imageUrls.length,
          description: `Processing ${imageUrls.length} pages synchronously...`
        })
        .eq('id', storyId);

      // Process synchronously (current method)
      const stylePrompt = artStylePrompts[artStyle as keyof typeof artStylePrompts] || artStylePrompts.classic_watercolor;
      let characterDescriptions = "";
      let artStyleGuidelines = "";
      let successfulPages = 0;
      let failedPages = 0;

      // Process each image
      for (let i = 0; i < imageUrls.length; i++) {
        try {
          // Check if story was cancelled during processing
          const { data: currentStory } = await supabase
            .from('stories')
            .select('status')
            .eq('id', storyId)
            .single();

          if (currentStory?.status === 'cancelled') {
            console.log(`[SYNC] Story ${storyId} was cancelled, stopping processing`);
            return new Response(
              JSON.stringify({ success: false, message: 'Story transformation was cancelled' }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          console.log(`[SYNC] Processing page ${i + 1} of ${imageUrls.length}`);
          
          const result = await processStoryPage({
            imageData: imageUrls[i], 
            pageNumber: i + 1, 
            storyId, 
            userId,
            stylePrompt,
            characterDescriptions,
            artStyleGuidelines,
            supabase
          });

          successfulPages++;

          // Update context for next pages
          if (i === 0) {
            characterDescriptions = `- Character designs and appearances established in page 1
- Clothing styles and color schemes from page 1`;
            artStyleGuidelines = `- Art style: ${stylePrompt}
- Visual language and composition style from page 1
- Text typography and placement style from page 1
- Portrait orientation (3:4 aspect ratio) with safe margins`;
          }

          console.log(`[SYNC] Completed page ${i + 1} of ${imageUrls.length}`);
        } catch (error) {
          if (error.message === 'Story transformation was cancelled') {
            console.log(`[SYNC] Story ${storyId} was cancelled, stopping processing`);
            return new Response(
              JSON.stringify({ success: false, message: 'Story transformation was cancelled' }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
          
          console.error(`[SYNC] Failed to process page ${i + 1}:`, error);
          failedPages++;
        }

        // Add delay between pages (except after the last page)
        if (i < imageUrls.length - 1) {
          const delayMs = 8000;
          console.log(`[SYNC] Waiting ${delayMs}ms before processing next page...`);
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }

      // Determine final status
      let finalStatus = 'completed';
      if (failedPages > 0 && successfulPages > 0) {
        finalStatus = 'partial';
      } else if (successfulPages === 0) {
        finalStatus = 'failed';
      }

      // Update story status
      await supabase
        .from('stories')
        .update({ 
          status: finalStatus,
          total_pages: imageUrls.length,
          description: finalStatus === 'completed' 
            ? `Story completed with ${successfulPages} pages` 
            : `Story processing failed: ${failedPages} pages failed`
        })
        .eq('id', storyId);

      console.log(`[SYNC] Story ${storyId} transformation completed: ${successfulPages} successful, ${failedPages} failed pages`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Story transformation completed: ${successfulPages} successful, ${failedPages} failed pages`,
          pages_processed: imageUrls.length,
          successful_pages: successfulPages,
          failed_pages: failedPages,
          status: finalStatus,
          processing_mode: 'synchronous'
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );

    } else {
      console.log(`[ASYNC] Processing ${imageUrls.length} images asynchronously`);
      
      // Update story status to processing
      await supabase
        .from('stories')
        .update({ 
          status: 'processing',
          total_pages: imageUrls.length,
          description: `Processing ${imageUrls.length} pages in background. Check back in 2-3 minutes...`
        })
        .eq('id', storyId);

      // Start background processing (no await - fire and forget)
      setTimeout(() => {
        processStoryAsync(storyId, imageUrls, artStyle, userId);
      }, 100); // Small delay to ensure response is sent first

      // Return immediately
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Story processing started in background. ${imageUrls.length} pages will be processed over the next 2-3 minutes.`,
          pages_to_process: imageUrls.length,
          estimated_completion_time: `${Math.ceil(imageUrls.length * 20 / 60)} minutes`,
          status: 'processing',
          processing_mode: 'asynchronous',
          instructions: 'Check your "Stories In Progress" section for real-time updates. Refresh the page to see progress.'
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

  } catch (error) {
    console.error('=== EDGE FUNCTION ERROR ===');
    console.error('Error in transform-story function:', error);
    console.error('Error stack:', error.stack);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        stack: error.stack,
        type: error.constructor.name
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
