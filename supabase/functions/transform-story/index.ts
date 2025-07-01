
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
import type { ImageData } from './types.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

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
    console.log('Raw body last 100 chars:', bodyText.substring(Math.max(0, bodyText.length - 100)));
    
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
        images: requestBody.images ? `array of ${requestBody.images.length}` : 'missing',
        artStyle: requestBody.artStyle || 'missing'
      });
    } catch (parseError) {
      console.error('JSON parsing failed:', parseError);
      console.error('Parse error details:', parseError.message);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid JSON in request body', 
          details: parseError.message,
          received_body: bodyText.substring(0, 1000) // First 1000 chars for debugging
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    const { storyId, images, artStyle = 'classic_watercolor' } = requestBody;

    console.log(`Processing story ${storyId} with ${images?.length || 0} images in ${artStyle} style`);

    // Validate required fields more thoroughly
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

    if (!images || !Array.isArray(images) || images.length === 0) {
      console.error('ERROR: Invalid or missing images array');
      return new Response(
        JSON.stringify({ 
          error: 'Invalid or missing images array', 
          received_images: images ? `type: ${typeof images}, length: ${images.length}` : 'null'
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
      .select('user_id')
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

    const userId = storyData.user_id;
    console.log('Found story for user:', userId);

    // Update story status to processing with exact page count
    console.log('Updating story status to processing...');
    const { error: updateError } = await supabase
      .from('stories')
      .update({ 
        status: 'processing',
        total_pages: images.length
      })
      .eq('id', storyId);

    if (updateError) {
      console.error('Story update error:', updateError);
    }

    // Get art style prompt
    const stylePrompt = artStylePrompts[artStyle as keyof typeof artStylePrompts] || artStylePrompts.classic_watercolor;

    let characterDescriptions = "";
    let artStyleGuidelines = "";
    let successfulPages = 0;
    let failedPages = 0;

    console.log('Starting image processing...');
    
    // Process each image with longer delays and better error handling
    for (let i = 0; i < images.length; i++) {
      try {
        console.log(`Processing page ${i + 1} of ${images.length}`);
        
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

        successfulPages++;

        // Update context for next pages (extract from first page to maintain consistency)
        if (i === 0) {
          characterDescriptions = `- Character designs and appearances established in page 1
- Clothing styles and color schemes from page 1`;
          artStyleGuidelines = `- Art style: ${stylePrompt}
- Visual language and composition style from page 1
- Text typography and placement style from page 1
- Portrait orientation (3:4 aspect ratio) with safe margins`;
        }

        console.log(`Completed page ${i + 1} of ${images.length} with ${artStyle} style`);
      } catch (error) {
        if (error.message === 'Story transformation was cancelled') {
          console.log(`Story ${storyId} was cancelled, stopping processing`);
          return new Response(
            JSON.stringify({ success: false, message: 'Story transformation was cancelled' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        console.error(`Failed to process page ${i + 1}:`, error);
        failedPages++;
        // Continue processing other pages
      }

      // Add longer delay between pages to avoid rate limiting (except after the last page)
      if (i < images.length - 1) {
        const delayMs = 8000; // Increased to 8 seconds between pages for better rate limiting
        console.log(`Waiting ${delayMs}ms before processing next page...`);
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
    console.log('Updating final story status...');
    await supabase
      .from('stories')
      .update({ 
        status: finalStatus,
        total_pages: images.length
      })
      .eq('id', storyId);

    console.log(`Story ${storyId} transformation completed: ${successfulPages} successful, ${failedPages} failed pages`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Story transformation completed: ${successfulPages} successful, ${failedPages} failed pages`,
        pages_processed: images.length,
        successful_pages: successfulPages,
        failed_pages: failedPages,
        status: finalStatus
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('=== EDGE FUNCTION ERROR ===');
    console.error('Error in transform-story function:', error);
    console.error('Error stack:', error.stack);
    
    // Try to update story status to failed for better error tracking
    try {
      const bodyText = await req.text().catch(() => '{}');
      const { storyId } = JSON.parse(bodyText).catch(() => ({}));
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
