
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

// Enhanced edge function health check with proper GET request
export const checkEdgeFunctionHealth = async (): Promise<boolean> => {
  try {
    console.log('Checking edge function health...');
    
    // Use GET request without body for health check
    const { data, error } = await supabase.functions.invoke('transform-story', {
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
  
  // Enhanced health check with fallback
  const isHealthy = await checkEdgeFunctionHealth();
  if (!isHealthy) {
    console.warn('Health check failed, but attempting transformation anyway...');
    // Don't immediately fail - the function might still work
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
      
      // Enhanced error handling with specific messages
      let errorMessage = 'Processing failed. Please try again.';
      
      if (error.message?.includes('Request with GET/HEAD method cannot have body')) {
        errorMessage = 'Service configuration error. Please contact support.';
      } else if (error.message?.includes('timeout')) {
        errorMessage = 'Request timed out. The service may be overloaded.';
      } else if (error.message?.includes('network')) {
        errorMessage = 'Network error. Please check your connection.';
      }
      
      // Mark story as failed with specific error
      await supabase
        .from('stories')
        .update({ 
          status: 'failed',
          description: errorMessage,
          updated_at: new Date().toISOString()
        })
        .eq('id', storyId);
      
      throw new Error(errorMessage);
    }
    
    console.log('Transform result:', data);
    return data;
  } catch (edgeFunctionError) {
    console.error('Edge function call failed with full error:', edgeFunctionError);
    
    // Enhanced error categorization
    let userFriendlyMessage = 'Transformation failed. Please try again.';
    
    if (edgeFunctionError.message?.includes('GET/HEAD method cannot have body')) {
      userFriendlyMessage = 'Service configuration issue. Please try again in a few minutes.';
    } else if (edgeFunctionError.message?.includes('FunctionsHttpError')) {
      userFriendlyMessage = 'Transform service is temporarily unavailable. Please try again later.';
    } else if (edgeFunctionError.message?.includes('timeout')) {
      userFriendlyMessage = 'Processing is taking longer than expected. Please try again.';
    }
    
    // Mark story as failed with user-friendly error
    await supabase
      .from('stories')
      .update({ 
        status: 'failed',
        description: userFriendlyMessage,
        updated_at: new Date().toISOString()
      })
      .eq('id', storyId);
    
    throw new Error(userFriendlyMessage);
  }
};

export const pollForStoryCompletion = async (storyId: string, userId: string, updateProgress: (progress: number) => void) => {
  console.log('Starting enhanced polling for story completion...');
  let attempts = 0;
  const maxAttempts = 60; // 5 minutes with 5-second intervals
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
      
      // Enhanced stuck detection
      if (updatedStory.status === lastStatus) {
        stuckCount++;
        if (stuckCount >= 12) { // If stuck for 12 attempts (60 seconds)
          console.warn('Story appears to be stuck, checking for progress...');
          
          // If no pages have been created and it's been stuck, mark as failed
          if (!updatedStory.story_pages || updatedStory.story_pages.length === 0) {
            console.error('Story is stuck with no pages created, marking as failed');
            await supabase
              .from('stories')
              .update({ 
                status: 'failed',
                description: 'Processing got stuck. Please try again with different images.',
                updated_at: new Date().toISOString()
              })
              .eq('id', storyId);
            
            throw new Error('Processing got stuck. Please try again with different images.');
          }
        }
      } else {
        stuckCount = 0; // Reset stuck counter if status changed
      }
      
      lastStatus = updatedStory.status;
      
      // Enhanced progress reporting
      if (updatedStory.story_pages?.length > 0) {
        const completedPages = updatedStory.story_pages.filter(p => p.transformation_status === 'completed').length;
        const failedPages = updatedStory.story_pages.filter(p => p.transformation_status === 'failed').length;
        const totalPages = updatedStory.total_pages || 0;
        
        console.log(`Pages status: ${completedPages}/${totalPages} completed, ${failedPages} failed`);
        
        // Better progress calculation based on actual page completion
        const progressFromPages = totalPages > 0 ? (completedPages / totalPages) * 45 : 0;
        updateProgress(50 + progressFromPages + (attempts / maxAttempts) * 5);
      } else {
        updateProgress(50 + (attempts / maxAttempts) * 45);
      }

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
      
      // Enhanced polling error handling
      if (attempts > 5) { // Give it a few attempts before marking as failed
        const errorMessage = pollError.message?.includes('stuck') 
          ? 'Processing got stuck. Please try again.'
          : `Polling failed: ${pollError.message}`;
          
        await supabase
          .from('stories')
          .update({ 
            status: 'failed',
            description: errorMessage,
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
  
  // Mark story as failed due to timeout with better message
  await supabase
    .from('stories')
    .update({ 
      status: 'failed',
      description: 'Processing timed out after 5 minutes. This may be due to high server load. Please try again.',
      updated_at: new Date().toISOString()
    })
    .eq('id', storyId);
  
  await cleanupTempImages(storyId, userId);
  throw new Error('Processing timed out after 5 minutes. Please try again.');
};
