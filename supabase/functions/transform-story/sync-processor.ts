
import { artStylePrompts } from './config.ts';
import { processStoryPage } from './story-processor.ts';

export async function processSynchronously(
  storyId: string, 
  imageUrls: any[], 
  artStyle: string, 
  userId: string, 
  supabase: any
) {
  console.log(`[SYNC] Processing ${imageUrls.length} images synchronously with enhanced error handling`);
  
  // Update story status to processing
  await supabase
    .from('stories')
    .update({ 
      status: 'processing',
      total_pages: imageUrls.length,
      description: `Processing page 1 of ${imageUrls.length} (synchronous mode)...`,
      updated_at: new Date().toISOString()
    })
    .eq('id', storyId);

  const stylePrompt = artStylePrompts[artStyle as keyof typeof artStylePrompts] || artStylePrompts.classic_watercolor;
  let characterDescriptions = "";
  let artStyleGuidelines = "";
  let successfulPages = 0;
  let failedPages = 0;

  // Process each image with enhanced error handling
  for (let i = 0; i < imageUrls.length; i++) {
    const currentPage = i + 1;
    
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
          description: `Processing page ${currentPage} of ${imageUrls.length} (${progressPercent}%)`,
          updated_at: new Date().toISOString()
        })
        .eq('id', storyId);

      console.log(`[SYNC] Processing page ${currentPage} of ${imageUrls.length}`);
      
      // Process with timeout protection
      const result = await Promise.race([
        processStoryPage({
          imageData: imageUrls[i], 
          pageNumber: currentPage, 
          storyId, 
          userId,
          stylePrompt,
          characterDescriptions,
          artStyleGuidelines,
          supabase
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Page processing timeout')), 120000) // 2 minute timeout per page
        )
      ]);

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

      console.log(`[SYNC] Completed page ${currentPage} of ${imageUrls.length}`);
    } catch (error) {
      if (error.message === 'Story transformation was cancelled') {
        console.log(`[SYNC] Story ${storyId} was cancelled, stopping processing at page ${currentPage}`);
        return {
          success: false, 
          message: 'Story transformation was cancelled',
          cancelled: true
        };
      }
      
      console.error(`[SYNC] Failed to process page ${currentPage}:`, error);
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

    // Phase 1 optimization: Reduced delay between pages for faster processing
    if (i < imageUrls.length - 1) {
      const delayMs = 1000; // Phase 1 optimization: Reduced from 5000ms to 1000ms
      console.log(`[SYNC] Waiting ${delayMs}ms before processing next page...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  // Determine final status
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

  console.log(`[SYNC] Story ${storyId} transformation completed: ${successfulPages} successful, ${failedPages} failed pages`);

  return {
    success: true, 
    message: finalDescription,
    pages_processed: imageUrls.length,
    successful_pages: successfulPages,
    failed_pages: failedPages,
    status: finalStatus,
    processing_mode: 'synchronous'
  };
}
