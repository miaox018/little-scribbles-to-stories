
import { processStoryWithCharacterAnalysis } from './story-processor.ts';

export async function startAsyncProcessing(
  storyId: string,
  imageUrls: Array<{ storageUrl: string; pageNumber: number }>,
  artStyle: string,
  userId: string,
  supabase: any
) {
  console.log(`[ASYNC] Starting background processing for ${imageUrls.length} pages with character-focused workflow`);
  
  // Start the background processing
  const backgroundTask = async () => {
    try {
      console.log(`[ASYNC] Background task started for story ${storyId}`);
      
      // Update story status to processing
      await supabase
        .from('stories')
        .update({ 
          status: 'processing',
          updated_at: new Date().toISOString()
        })
        .eq('id', storyId);

      // Process with character analysis workflow
      const result = await processStoryWithCharacterAnalysis(storyId, imageUrls, artStyle, userId, supabase);
      
      // Determine final status
      let finalStatus = 'failed';
      if (result.completedPages === imageUrls.length) {
        finalStatus = 'completed';
      } else if (result.completedPages > 0) {
        finalStatus = 'partial';
      }
      
      // Update final story status
      await supabase
        .from('stories')
        .update({ 
          status: finalStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', storyId);

      console.log(`[ASYNC] Background processing completed with status: ${finalStatus}, ${result.completedPages}/${imageUrls.length} pages successful`);
      
    } catch (error) {
      console.error(`[ASYNC] Background processing failed for story ${storyId}:`, error);
      
      // Update story status to failed
      await supabase
        .from('stories')
        .update({ 
          status: 'failed',
          updated_at: new Date().toISOString()
        })
        .eq('id', storyId);
    }
  };

  // Start background task using EdgeRuntime.waitUntil
  EdgeRuntime.waitUntil(backgroundTask());
  
  console.log(`[ASYNC] Background task initiated for story ${storyId}`);
  
  return {
    success: true,
    message: `Enhanced background processing started for ${imageUrls.length} pages with character consistency`,
    status: 'processing',
    processingMode: 'async',
    estimatedMinutes: Math.ceil(imageUrls.length * 2) // Updated estimate with character analysis
  };
}
