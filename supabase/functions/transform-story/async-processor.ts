
import { artStylePrompts } from './config.ts';
import { processStoryPage } from './story-processor.ts';

// Background processing function (no timeout limits)
export async function processStoryAsync(storyId: string, imageUrls: any[], artStyle: string, userId: string) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.7.1');
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

export async function startAsyncProcessing(storyId: string, imageUrls: any[], artStyle: string, userId: string, supabase: any) {
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
  return {
    success: true, 
    message: `Story processing started in background. ${imageUrls.length} pages will be processed over the next 2-3 minutes.`,
    pages_to_process: imageUrls.length,
    estimated_completion_time: `${Math.ceil(imageUrls.length * 20 / 60)} minutes`,
    status: 'processing',
    processing_mode: 'asynchronous',
    instructions: 'Check your "Stories In Progress" section for real-time updates. Refresh the page to see progress.'
  };
}
