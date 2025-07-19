import { artStylePrompts } from './config.ts';
import { processStoryPage } from './story-processor.ts';
import { ErrorHandler, StoryProcessingError, ErrorContext } from './error-handler.ts';

export async function processSynchronously(
  storyId: string, 
  imageUrls: any[], 
  artStyle: string, 
  userId: string, 
  supabase: any
) {
  console.log(`[SYNC] Phase 3: Processing ${imageUrls.length} images synchronously with comprehensive error handling and recovery`);
  
  // Update story status to processing
  await supabase
    .from('stories')
    .update({ 
      status: 'processing',
      total_pages: imageUrls.length,
      description: `Phase 3: Processing page 1 of ${imageUrls.length} (enhanced synchronous mode)...`,
      updated_at: new Date().toISOString()
    })
    .eq('id', storyId);

  const stylePrompt = artStylePrompts[artStyle as keyof typeof artStylePrompts] || artStylePrompts.classic_watercolor;
  let characterDescriptions = "";
  let artStyleGuidelines = "";
  let successfulPages = 0;
  let failedPages = 0;

  // Process each image with Phase 3 enhanced error handling
  for (let i = 0; i < imageUrls.length; i++) {
    const currentPage = i + 1;
    
    const context: ErrorContext = {
      storyId,
      pageNumber: currentPage,
      userId,
      operation: 'sync_process_page',
      attempt: 1,
      timestamp: new Date().toISOString()
    };
    
    try {
      // Check if story was cancelled during processing
      const { data: currentStory } = await supabase
        .from('stories')
        .select('status')
        .eq('id', storyId)
        .single();

      if (currentStory?.status === 'cancelled') {
        console.log(`[SYNC] Story ${storyId} was cancelled, stopping processing at page ${currentPage}`);
        return {
          success: false, 
          message: 'Story transformation was cancelled',
          cancelled: true
        };
      }

      // Update progress with detailed status
      const progressPercent = Math.round((i / imageUrls.length) * 100);
      await supabase
        .from('stories')
        .update({ 
          description: `Phase 3: Processing page ${currentPage} of ${imageUrls.length} (${progressPercent}%)`,
          updated_at: new Date().toISOString()
        })
        .eq('id', storyId);

      console.log(`[SYNC] Phase 3: Processing page ${currentPage} of ${imageUrls.length} with enhanced error handling`);
      
      // Phase 3: Enhanced processing with comprehensive error handling
      await ErrorHandler.handleWithRetry(
        () => processStoryPage({
          imageData: imageUrls[i], 
          pageNumber: currentPage, 
          storyId, 
          userId,
          stylePrompt,
          characterDescriptions,
          artStyleGuidelines,
          supabase
        }),
        context,
        3 // Max retries for sync processing
      );

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

      console.log(`[SYNC] Phase 3: Completed page ${currentPage} of ${imageUrls.length}`);
    } catch (error) {
      if (error.message === 'Story transformation was cancelled') {
        console.log(`[SYNC] Story ${storyId} was cancelled, stopping processing at page ${currentPage}`);
        return {
          success: false, 
          message: 'Story transformation was cancelled',
          cancelled: true
        };
      }
      
      console.error(`[SYNC] Phase 3: Failed to process page ${currentPage}:`, error);
      failedPages++;
      
      // Phase 3: Enhanced error logging
      if (error instanceof StoryProcessingError) {
        await ErrorHandler.logError(error, supabase);
      }
      
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

    // Phase 3: Adaptive delay based on success rate
    if (i < imageUrls.length - 1) {
      const successRate = successfulPages / (successfulPages + failedPages);
      const baseDelay = 1000; // Phase 1 optimization maintained
      const adaptiveDelay = successRate >= 0.8 ? baseDelay * 0.8 : baseDelay * 1.2;
      
      console.log(`[SYNC] Phase 3: Adaptive delay ${adaptiveDelay}ms (success rate: ${(successRate * 100).toFixed(1)}%)`);
      await new Promise(resolve => setTimeout(resolve, adaptiveDelay));
    }
  }

  // Determine final status
  let finalStatus = 'completed';
  let finalDescription = '';
  
  if (failedPages > 0 && successfulPages > 0) {
    finalStatus = 'partial';
    finalDescription = `Story partially completed: ${successfulPages} successful, ${failedPages} failed pages. Phase 3 error recovery available.`;
  } else if (successfulPages === 0) {
    finalStatus = 'failed';
    finalDescription = `Story processing failed: All ${failedPages} pages failed to process despite Phase 3 recovery attempts.`;
  } else {
    finalDescription = `Story completed successfully with ${successfulPages} pages using Phase 3 optimizations.`;
  }

  // Update story status
  await supabase
    .from('stories')
    .update({ 
      status: finalStatus,
      total_pages: imageUrls.length,
      description: finalDescription,
      updated_at: new Date().toISOString()
    })
    .eq('id', storyId);

  console.log(`[SYNC] Phase 3: Story ${storyId} transformation completed: ${successfulPages} successful, ${failedPages} failed pages`);

  return {
    success: true, 
    message: finalDescription,
    pages_processed: imageUrls.length,
    successful_pages: successfulPages,
    failed_pages: failedPages,
    status: finalStatus,
    processing_mode: 'enhanced_synchronous',
    phase: 3,
    features: [
      'Enhanced error handling & recovery',
      'Adaptive timing based on success rates',
      'Circuit breaker protection',
      'Comprehensive error logging'
    ]
  };
}
