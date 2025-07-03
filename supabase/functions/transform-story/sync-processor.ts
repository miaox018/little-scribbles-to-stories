
import { artStylePrompts } from './config.ts';
import { processStoryPage } from './story-processor.ts';

export async function processSynchronously(
  storyId: string, 
  imageUrls: any[], 
  artStyle: string, 
  userId: string, 
  supabase: any
) {
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
        return {
          success: false, 
          message: 'Story transformation was cancelled',
          cancelled: true
        };
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
        return {
          success: false, 
          message: 'Story transformation was cancelled',
          cancelled: true
        };
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

  return {
    success: true, 
    message: `Story transformation completed: ${successfulPages} successful, ${failedPages} failed pages`,
    pages_processed: imageUrls.length,
    successful_pages: successfulPages,
    failed_pages: failedPages,
    status: finalStatus,
    processing_mode: 'synchronous'
  };
}
