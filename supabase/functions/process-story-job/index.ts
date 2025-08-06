import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProcessJobRequest {
  jobId: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[PROCESS-JOB] Starting job processing...');
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request
    const { jobId }: ProcessJobRequest = await req.json();
    
    if (!jobId) {
      throw new Error('Missing jobId parameter');
    }

    console.log('[PROCESS-JOB] Processing job:', jobId);

    // Get job details
    const { data: job, error: jobError } = await supabase
      .from('story_processing_jobs')
      .select(`
        *,
        stories (
          id,
          title,
          user_id,
          art_style,
          character_sheet_url,
          style_bible,
          character_descriptions
        )
      `)
      .eq('id', jobId)
      .single();

    if (jobError || !job) {
      throw new Error(`Job not found: ${jobError?.message}`);
    }

    if (job.status !== 'pending') {
      throw new Error(`Job is not in pending status: ${job.status}`);
    }

    // Update job to processing
    await supabase
      .from('story_processing_jobs')
      .update({ 
        status: 'processing',
        started_at: new Date().toISOString(),
        progress_percentage: 5
      })
      .eq('id', jobId);

    console.log('[PROCESS-JOB] Job updated to processing status');

    // Get story pages to process
    const { data: pages, error: pagesError } = await supabase
      .from('story_pages')
      .select('*')
      .eq('story_id', job.story_id)
      .order('page_number');

    if (pagesError) {
      throw new Error(`Failed to fetch story pages: ${pagesError.message}`);
    }

    if (!pages || pages.length === 0) {
      throw new Error('No pages found for story');
    }

    console.log('[PROCESS-JOB] Found', pages.length, 'pages to process');

    let successfulPages = 0;
    let characterSheetUrl = job.stories.character_sheet_url;

    // Process each page
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const pageNumber = page.page_number;
      
      try {
        console.log(`[PROCESS-JOB] Processing page ${pageNumber}...`);
        
        // Update job progress
        const progress = Math.round(10 + (i / pages.length) * 70);
        await supabase
          .from('story_processing_jobs')
          .update({ 
            progress_percentage: progress,
            current_page: pageNumber
          })
          .eq('id', jobId);

        // Get normalized image URL for this page
        const normalizedImageUrl = page.original_image_url; // Will be updated when we integrate normalization
        
        if (!normalizedImageUrl) {
          throw new Error(`No normalized image URL for page ${pageNumber}`);
        }

        // Step 1: Analyze page with GPT-4o
        console.log(`[PROCESS-JOB] Analyzing page ${pageNumber}...`);
        const analysisResponse = await supabase.functions.invoke('analyze-story-page', {
          body: {
            imageUrl: normalizedImageUrl,
            pageNumber: pageNumber,
            storyId: job.story_id
          }
        });

        if (analysisResponse.error) {
          throw new Error(`Analysis failed: ${analysisResponse.error.message}`);
        }

        const analysis = analysisResponse.data.analysis;
        console.log(`[PROCESS-JOB] Page ${pageNumber} analysis completed`);

        // Step 2: Generate illustration with GPT-Image-1
        console.log(`[PROCESS-JOB] Generating illustration for page ${pageNumber}...`);
        const generationResponse = await supabase.functions.invoke('generate-story-page', {
          body: {
            storyId: job.story_id,
            pageNumber: pageNumber,
            analysis: analysis,
            artStyle: job.stories.art_style || 'classic_watercolor',
            characterSheet: characterSheetUrl,
            styleBible: job.stories.style_bible || {}
          }
        });

        if (generationResponse.error) {
          throw new Error(`Generation failed: ${generationResponse.error.message}`);
        }

        const generatedImageUrl = generationResponse.data.generatedImageUrl;
        console.log(`[PROCESS-JOB] Page ${pageNumber} generation completed`);

        // Update story page with results
        await supabase
          .from('story_pages')
          .update({
            generated_image_url: generatedImageUrl,
            original_text: analysis.handwriting_text,
            final_text: analysis.handwriting_text,
            ocr_confidence: analysis.ocr_confidence,
            analysis_data: analysis,
            transformation_status: 'completed',
            processing_job_id: jobId
          })
          .eq('id', page.id);

        // Generate character sheet after first page if not exists
        if (pageNumber === 1 && !characterSheetUrl && analysis.scene?.characters?.length > 0) {
          console.log('[PROCESS-JOB] Generating character sheet...');
          try {
            const characterSheetResponse = await supabase.functions.invoke('generate-story-page', {
              body: {
                storyId: job.story_id,
                pageNumber: 0, // Special page number for character sheet
                analysis: {
                  handwriting_text: '',
                  scene: {
                    characters: analysis.scene.characters,
                    objects: [],
                    layout: 'character lineup',
                    setting: 'white background'
                  },
                  palette: analysis.palette,
                  style_notes: 'character reference sheet',
                  safety_flags: []
                },
                artStyle: job.stories.art_style || 'classic_watercolor',
                characterSheet: null,
                styleBible: { type: 'character_reference', purpose: 'consistency' }
              }
            });

            if (!characterSheetResponse.error) {
              characterSheetUrl = characterSheetResponse.data.generatedImageUrl;
              
              // Update story with character sheet
              await supabase
                .from('stories')
                .update({
                  character_sheet_url: characterSheetUrl,
                  character_descriptions: analysis.scene.characters
                })
                .eq('id', job.story_id);

              console.log('[PROCESS-JOB] Character sheet generated and saved');
            }
          } catch (charError) {
            console.warn('[PROCESS-JOB] Character sheet generation failed:', charError);
            // Don't fail the whole job for character sheet issues
          }
        }

        successfulPages++;
        console.log(`[PROCESS-JOB] Page ${pageNumber} completed successfully`);

      } catch (pageError) {
        console.error(`[PROCESS-JOB] Error processing page ${pageNumber}:`, pageError);
        
        // Update page with error status
        await supabase
          .from('story_pages')
          .update({
            transformation_status: 'failed',
            error_message: pageError.message,
            processing_job_id: jobId
          })
          .eq('id', page.id);
      }

      // Add delay between pages to avoid rate limits
      if (i < pages.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    // Determine final job status
    let finalStatus = 'completed';
    let finalProgress = 100;
    
    if (successfulPages === 0) {
      finalStatus = 'failed';
      finalProgress = 0;
    } else if (successfulPages < pages.length) {
      finalStatus = 'completed'; // Partial success still counts as completed
      finalProgress = Math.round((successfulPages / pages.length) * 100);
    }

    // Update job with final status
    await supabase
      .from('story_processing_jobs')
      .update({
        status: finalStatus,
        progress_percentage: finalProgress,
        completed_at: new Date().toISOString(),
        error_message: successfulPages === 0 ? 'All pages failed to process' : null
      })
      .eq('id', jobId);

    // Update story status if all pages completed
    if (finalStatus === 'completed') {
      await supabase
        .from('stories')
        .update({ status: 'completed' })
        .eq('id', job.story_id);
    }

    console.log(`[PROCESS-JOB] Job completed. Status: ${finalStatus}, Pages: ${successfulPages}/${pages.length}`);

    return new Response(JSON.stringify({
      success: true,
      jobId,
      status: finalStatus,
      processedPages: successfulPages,
      totalPages: pages.length,
      characterSheetGenerated: !!characterSheetUrl
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[PROCESS-JOB] Error:', error);

    // Update job status to failed if we have a jobId
    try {
      const { jobId } = await req.json();
      if (jobId) {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        
        await supabase
          .from('story_processing_jobs')
          .update({
            status: 'failed',
            error_message: error.message,
            completed_at: new Date().toISOString()
          })
          .eq('id', jobId);
      }
    } catch (updateError) {
      console.error('[PROCESS-JOB] Failed to update job status:', updateError);
    }

    return new Response(JSON.stringify({
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});