
import { supabase } from '@/integrations/supabase/client';
import { uploadImagesToStorage, cleanupTempImages } from './storage-operations';

export const createStoryRecord = async (userId: string, title: string, artStyle: string, imageCount: number) => {
  console.log('Creating story record...');
  
  const { data: story, error: storyError } = await supabase
    .from('stories')
    .insert({
      user_id: userId,
      title,
      status: 'processing',
      art_style: artStyle,
      total_pages: imageCount
    })
    .select()
    .single();

  if (storyError) throw storyError;
  console.log('Created story:', story);
  
  return story;
};

export const uploadImagesAndGetUrls = async (images: File[], storyId: string, userId: string) => {
  console.log('Preparing image data by uploading to storage...');
  
  const imageUrls = await uploadImagesToStorage(images, storyId, userId);
  console.log('Images uploaded to storage:', imageUrls.length);
  
  return imageUrls;
};

// Enhanced edge function health check
export const checkEdgeFunctionHealth = async (): Promise<boolean> => {
  try {
    console.log('Checking edge function health...');
    const { data, error } = await supabase.functions.invoke('transform-story', {
      body: {},
      method: 'GET'
    });
    
    if (error) {
      console.error('Edge function health check failed:', error);
      return false;
    }
    
    console.log('Edge function health check passed:', data);
    return data?.status === 'healthy';
  } catch (error) {
    console.error('Edge function health check error:', error);
    return false;
  }
};

export const callTransformStoryFunction = async (storyId: string, imageUrls: any[], artStyle: string) => {
  console.log('=== CLIENT SIDE EDGE FUNCTION CALL ===');
  console.log('Story ID:', storyId);
  console.log('Images count:', imageUrls.length);
  console.log('Art style:', artStyle);
  
  // First check if edge function is healthy
  const isHealthy = await checkEdgeFunctionHealth();
  if (!isHealthy) {
    console.error('Edge function is not healthy, marking story as failed');
    await supabase
      .from('stories')
      .update({ 
        status: 'failed',
        description: 'Edge function is not available. Please try again later.',
        updated_at: new Date().toISOString()
      })
      .eq('id', storyId);
    
    throw new Error('Transform service is temporarily unavailable. Please try again later.');
  }
  
  const payload = {
    storyId: storyId,
    imageUrls: imageUrls,
    artStyle
  };
  
  console.log('Payload structure:', {
    storyId: typeof payload.storyId,
    imageUrls: Array.isArray(payload.imageUrls) ? `array[${payload.imageUrls.length}]` : typeof payload.imageUrls,
    artStyle: typeof payload.artStyle
  });
  
  try {
    console.log('Calling supabase.functions.invoke...');
    
    const startTime = Date.now();
    const { data, error } = await supabase.functions.invoke('transform-story', {
      body: payload
    });
    const endTime = Date.now();
    
    console.log(`Edge function call completed in ${endTime - startTime}ms`);

    if (error) {
      console.error('Edge function error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack,
        context: error.context
      });
      
      // Mark story as failed if edge function fails
      await supabase
        .from('stories')
        .update({ 
          status: 'failed',
          description: `Edge function error: ${error.message}`,
          updated_at: new Date().toISOString()
        })
        .eq('id', storyId);
      
      throw error;
    }
    
    console.log('Transform result:', data);
    return data;
  } catch (edgeFunctionError) {
    console.error('Edge function call failed with full error:', edgeFunctionError);
    
    // Mark story as failed on critical error
    await supabase
      .from('stories')
      .update({ 
        status: 'failed',
        description: `Processing failed: ${edgeFunctionError.message}`,
        updated_at: new Date().toISOString()
      })
      .eq('id', storyId);
    
    throw edgeFunctionError;
  }
};

export const pollForStoryCompletion = async (storyId: string, userId: string, updateProgress: (progress: number) => void) => {
  console.log('Starting polling for story completion...');
  let attempts = 0;
  const maxAttempts = 60; // Reduced from 180 to 60 (5 minutes with 5-second intervals)
  const startTime = Date.now();
  let lastStatus = 'unknown';
  let stuckCount = 0;
  
  while (attempts < maxAttempts) {
    try {
      const { data: updatedStory, error } = await supabase
        .from('stories')
        .select(`
          *,
          story_pages (
            id,
            page_number,
            original_image_url,
            generated_image_url,
            transformation_status
          )
        `)
        .eq('id', storyId)
        .single();

      if (error) throw error;

      const elapsedMinutes = (Date.now() - startTime) / 1000 / 60;
      console.log(`Polling attempt ${attempts + 1}/${maxAttempts} (${elapsedMinutes.toFixed(1)}min elapsed)`);
      console.log('Current story status:', updatedStory.status);
      
      // Detect if story is stuck
      if (updatedStory.status === lastStatus) {
        stuckCount++;
        if (stuckCount >= 10) { // If stuck for 10 attempts (50 seconds)
          console.warn('Story appears to be stuck, checking for progress...');
          
          // If no pages have been created after being stuck, mark as failed
          if (!updatedStory.story_pages || updatedStory.story_pages.length === 0) {
            console.error('Story is stuck with no pages created, marking as failed');
            await supabase
              .from('stories')
              .update({ 
                status: 'failed',
                description: 'Story processing got stuck. Please try again.',
                updated_at: new Date().toISOString()
              })
              .eq('id', storyId);
            
            throw new Error('Story processing got stuck. Please try again.');
          }
        }
      } else {
        stuckCount = 0; // Reset stuck counter if status changed
      }
      
      lastStatus = updatedStory.status;
      
      if (updatedStory.story_pages?.length > 0) {
        const completedPages = updatedStory.story_pages.filter(p => p.transformation_status === 'completed').length;
        const failedPages = updatedStory.story_pages.filter(p => p.transformation_status === 'failed').length;
        const totalPages = updatedStory.total_pages || 0;
        
        console.log(`Pages status: ${completedPages}/${totalPages} completed, ${failedPages} failed`);
      }

      updateProgress(50 + (attempts / maxAttempts) * 45);

      if (['completed', 'failed', 'partial'].includes(updatedStory.status)) {
        console.log('Story processing completed via polling');
        console.log('Final story status:', updatedStory.status);
        await cleanupTempImages(storyId, userId);
        return updatedStory;
      }

      await new Promise(resolve => setTimeout(resolve, 5000));
      attempts++;
    } catch (pollError) {
      console.error('Polling error:', pollError);
      
      // If we get a critical error, mark story as failed
      if (attempts > 5) { // Give it a few attempts before marking as failed
        await supabase
          .from('stories')
          .update({ 
            status: 'failed',
            description: `Polling failed: ${pollError.message}`,
            updated_at: new Date().toISOString()
          })
          .eq('id', storyId);
        
        throw pollError;
      }
      
      await new Promise(resolve => setTimeout(resolve, 5000));
      attempts++;
    }
  }
  
  console.error('Story processing timeout after', maxAttempts, 'attempts');
  
  // Mark story as failed due to timeout
  await supabase
    .from('stories')
    .update({ 
      status: 'failed',
      description: 'Story processing timed out. Please try again.',
      updated_at: new Date().toISOString()
    })
    .eq('id', storyId);
  
  await cleanupTempImages(storyId, userId);
  throw new Error('Story processing timed out after 5 minutes. Please try again.');
};
