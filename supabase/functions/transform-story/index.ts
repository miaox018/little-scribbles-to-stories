
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { corsHeaders, artStylePrompts } from './config.ts';
import { processStoryPage, createMasterStoryAnalysis } from './story-processor.ts';
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

    console.log('Phase 1: Creating master story analysis...');
    
    // PHASE 1: Create master story analysis from all images
    const masterContext = await createMasterStoryAnalysis({
      images,
      stylePrompt,
      storyId,
      supabase
    });

    console.log('Phase 2: Generating all illustrations in parallel...');

    // PHASE 2: Process all pages in parallel using master context
    const processingPromises = images.map((imageData: ImageData, index: number) => 
      processStoryPage({
        imageData, 
        pageNumber: index + 1, 
        storyId, 
        userId,
        stylePrompt,
        masterContext,
        supabase
      })
    );

    // Check for cancellation before parallel processing
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

    // Wait for all pages to complete processing
    try {
      await Promise.all(processingPromises);
      console.log(`All ${images.length} pages processed successfully in parallel`);
    } catch (error) {
      if (error.message === 'Story transformation was cancelled') {
        console.log(`Story ${storyId} was cancelled during processing`);
        return new Response(
          JSON.stringify({ success: false, message: 'Story transformation was cancelled' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw error;
    }

    // Update story status to completed with final page count verification
    await supabase
      .from('stories')
      .update({ 
        status: 'completed',
        total_pages: images.length
      })
      .eq('id', storyId);

    console.log(`Story ${storyId} transformation completed: ${images.length} pages processed with ${artStyle} style`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Story transformation completed: ${images.length} pages processed with ${artStyle} style`,
        pages_processed: images.length
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
