
import { artStylePrompts } from './config.ts';
import { processStoryPage } from './story-processor.ts';

// Enhanced background processing function with proper error handling and recovery
export async function processStoryAsync(storyId: string, imageUrls: any[], artStyle: string, userId: string) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.7.1');
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  console.log(`[ASYNC] Starting enhanced background processing for story ${storyId} with ${imageUrls.length} images`);
  
  try {
    // Mark story as actively processing with recovery info
    await supabase
      .from('stories')
      .update({ 
        status: 'processing',
        description: `Processing page 1 of ${imageUrls.length}...`,
        updated_at: new Date().toISOString()
      })
      .eq('id', storyId);

    const stylePrompt = artStylePrompts[artStyle as keyof typeof artStylePrompts] || artStylePrompts.classic_watercolor;
    let characterDescriptions = "";
    let artStyleGuidelines = "";
    let successfulPages = 0;
    let failedPages = 0;
    let lastProcessedPage = 0;

    // Process each image with enhanced error handling and recovery
    for (let i = 0; i < imageUrls.length; i++) {
      const currentPage = i + 1;
      lastProcessedPage = currentPage;
      
      try {
        // Check if story was cancelled
        const { data: story } = await supabase
          .from('stories')
          .select('status')
          .eq('id', storyId)
          .single();

        if (story?.status === 'cancelled') {
          console.log(`[ASYNC] Story ${storyId} was cancelled, stopping processing at page ${currentPage}`);
          return;
        }

        // Update progress with detailed status
        const progressPercent = Math.round((i / imageUrls.length) * 100);
        await supabase
          .from('stories')
          .update({ 
            status: 'processing',
            description: `Processing page ${currentPage} of ${imageUrls.length} (${progressPercent}%)`,
            updated_at: new Date().toISOString()
          })
          .eq('id', storyId);

        console.log(`[ASYNC] Processing page ${currentPage} of ${imageUrls.length}`);
        
        // Process the page with retry logic
        await processStoryPageWithRetry({
          imageData: imageUrls[i], 
          pageNumber: currentPage, 
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

        console.log(`[ASYNC] Completed page ${currentPage} of ${imageUrls.length}`);
      } catch (error) {
        if (error.message === 'Story transformation was cancelled') {
          console.log(`[ASYNC] Story ${storyId} was cancelled, stopping processing at page ${currentPage}`);
          return;
        }
        
        console.error(`[ASYNC] Failed to process page ${currentPage}:`, error);
        failedPages++;
        
        // Mark this specific page as failed
        await supabase
          .from('story_pages')
          .upsert({
            story_id: storyId,
            page_number: currentPage,
            original_image_url: imageUrls[i].storageUrl || null,
            generated_image_url: null,
            enhanced_prompt: null,
            transformation_status: 'failed'
          }, {
            onConflict: 'story_id,page_number'
          });
      }

      // Reduced delay between pages for faster processing
      if (i < imageUrls.length - 1) {
        const delayMs = 5000; // Reduced from 8000ms to 5000ms
        console.log(`[ASYNC] Waiting ${delayMs}ms before processing next page...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }

    // Determine final status based on results
    let finalStatus = 'completed';
    let finalDescription = '';
    
    if (failedPages > 0 && successfulPages > 0) {
      finalStatus = 'partial';
      finalDescription = `Story partially completed: ${successfulPages} successful, ${failedPages} failed pages. You can regenerate the failed pages.`;
    } else if (successfulPages === 0) {
      finalStatus = 'failed';
      finalDescription = `Story processing failed: All ${failedPages} pages failed to process.`;
    } else {
      finalDescription = `Story completed successfully with ${successfulPages} pages.`;
    }

    // Update final story status
    console.log(`[ASYNC] Story ${storyId} transformation completed: ${successfulPages} successful, ${failedPages} failed pages`);
    await supabase
      .from('stories')
      .update({ 
        status: finalStatus,
        total_pages: imageUrls.length,
        description: finalDescription,
        updated_at: new Date().toISOString()
      })
      .eq('id', storyId);

  } catch (error) {
    console.error(`[ASYNC] Critical error in background processing for story ${storyId}:`, error);
    
    // Update story status to failed with error details
    await supabase
      .from('stories')
      .update({ 
        status: 'failed',
        description: `Processing failed at page ${lastProcessedPage || 1}: ${error.message}`,
        updated_at: new Date().toISOString()
      })
      .eq('id', storyId);
  }
}

// Enhanced page processing with retry logic
async function processStoryPageWithRetry(params: any, maxRetries = 2) {
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        console.log(`[RETRY] Attempting page ${params.pageNumber} - retry ${attempt}/${maxRetries}`);
        await new Promise(resolve => setTimeout(resolve, 2000 * attempt)); // Exponential backoff
      }
      
      return await processStoryPage(params);
    } catch (error) {
      lastError = error;
      console.error(`[RETRY] Page ${params.pageNumber} attempt ${attempt + 1} failed:`, error);
      
      if (attempt === maxRetries) {
        throw lastError;
      }
    }
  }
}

export async function startAsyncProcessing(storyId: string, imageUrls: any[], artStyle: string, userId: string, supabase: any) {
  console.log(`[ASYNC] Starting enhanced processing for ${imageUrls.length} images asynchronously`);
  
  // Update story status to processing
  await supabase
    .from('stories')
    .update({ 
      status: 'processing',
      total_pages: imageUrls.length,
      description: `Initializing background processing for ${imageUrls.length} pages...`,
      updated_at: new Date().toISOString()
    })
    .eq('id', storyId);

  // Use EdgeRuntime.waitUntil for proper background processing
  try {
    EdgeRuntime.waitUntil(processStoryAsync(storyId, imageUrls, artStyle, userId));
  } catch (error) {
    // Fallback to setTimeout if EdgeRuntime is not available
    console.log('[ASYNC] EdgeRuntime not available, using setTimeout fallback');
    setTimeout(() => {
      processStoryAsync(storyId, imageUrls, artStyle, userId);
    }, 100);
  }

  // Return immediately with enhanced response
  return {
    success: true, 
    message: `Enhanced background processing started for ${imageUrls.length} pages. Processing will continue even if you close this page.`,
    pages_to_process: imageUrls.length,
    estimated_completion_time: `${Math.ceil(imageUrls.length * 15 / 60)} minutes`, // Reduced estimate
    status: 'processing',
    processing_mode: 'asynchronous',
    instructions: 'Check your "Stories In Progress" section for real-time updates. The story will automatically complete in the background.',
    recovery_info: 'If processing appears stuck, use the "Recover Stories" button to check for completed stories.'
  };
}
