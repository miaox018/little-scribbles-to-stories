
import { processStoryWithCharacterAnalysis } from './story-processor.ts';

export async function processSynchronously(
  storyId: string,
  imageUrls: Array<{ storageUrl: string; pageNumber: number }>,
  artStyle: string,
  userId: string,
  supabase: any
) {
  console.log(`[SYNC] Processing ${imageUrls.length} pages with character-focused workflow`);
  
  try {
    // Check if story was cancelled before starting
    const { data: story } = await supabase
      .from('stories')
      .select('status')
      .eq('id', storyId)
      .single();

    if (story?.status === 'cancelled') {
      return {
        success: false,
        message: 'Story processing was cancelled before it could start',
        cancelled: true
      };
    }

    // Update story status
    await supabase
      .from('stories')
      .update({ 
        status: 'processing',
        updated_at: new Date().toISOString()
      })
      .eq('id', storyId);

    // Process story with character analysis workflow
    const result = await processStoryWithCharacterAnalysis(storyId, imageUrls, artStyle, userId, supabase);
    
    // Determine final story status
    let finalStatus = 'failed';
    if (result.completedPages === imageUrls.length) {
      finalStatus = 'completed';
    } else if (result.completedPages > 0) {
      finalStatus = 'partial';
    }
    
    // Update story status
    await supabase
      .from('stories')
      .update({ 
        status: finalStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', storyId);

    console.log(`[SYNC] Story processing completed with status: ${finalStatus}`);
    
    return {
      success: result.success,
      message: result.message,
      status: finalStatus,
      completedPages: result.completedPages,
      totalPages: imageUrls.length
    };
    
  } catch (error) {
    console.error('[SYNC] Error processing story:', error);
    
    // Update story status to failed
    await supabase
      .from('stories')
      .update({ 
        status: 'failed',
        updated_at: new Date().toISOString()
      })
      .eq('id', storyId);

    return {
      success: false,
      message: `Synchronous processing failed: ${error.message}`,
      status: 'failed'
    };
  }
}
