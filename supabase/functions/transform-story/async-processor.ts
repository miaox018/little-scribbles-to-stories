
import { processStoryWithCharacterAnalysis } from './story-processor.ts';

export async function startAsyncProcessing(
  storyId: string,
  imageUrls: Array<{ storageUrl: string; pageNumber: number }>,
  artStyle: string,
  userId: string,
  supabase: any
) {
  console.log(`[ASYNC] Starting smart background processing for ${imageUrls.length} pages with intelligent character analysis`);
  
  // Start the background processing
  const backgroundTask = async () => {
    try {
      console.log(`[ASYNC] Smart background task started for story ${storyId}`);
      
      // Update story status to processing
      await supabase
        .from('stories')
        .update({ 
          status: 'processing',
          updated_at: new Date().toISOString()
        })
        .eq('id', storyId);

      // Process with smart character analysis workflow
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

      console.log(`[ASYNC] Smart background processing completed with status: ${finalStatus}, ${result.completedPages}/${imageUrls.length} pages successful`);
      
    } catch (error) {
      console.error(`[ASYNC] Smart background processing failed for story ${storyId}:`, error);
      
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
  
  console.log(`[ASYNC] Smart background task initiated for story ${storyId}`);
  
  return {
    success: true,
    message: `Smart background processing started for ${imageUrls.length} pages with intelligent content analysis and optimized token usage`,
    status: 'processing',
    processingMode: 'async',
    estimatedMinutes: Math.ceil(imageUrls.length * 1.5) // Reduced estimate due to optimized processing
  };
}
