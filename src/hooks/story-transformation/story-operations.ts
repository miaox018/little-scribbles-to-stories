
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

export const callTransformStoryFunction = async (storyId: string, imageUrls: any[], artStyle: string) => {
  console.log('=== CLIENT SIDE EDGE FUNCTION CALL ===');
  console.log('Story ID:', storyId);
  console.log('Images count:', imageUrls.length);
  console.log('Art style:', artStyle);
  console.log('Sample image URL structure:', {
    hasStorageUrl: !!imageUrls[0]?.storageUrl,
    storageUrl: imageUrls[0]?.storageUrl?.substring(0, 100) + '...',
    pageNumber: imageUrls[0]?.pageNumber
  });
  
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
  
  console.log('Payload JSON string length:', JSON.stringify(payload).length);
  console.log('Full payload for debugging:', JSON.stringify(payload, null, 2));
  
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
      
      // Check for specific error types
      if (error.message?.includes('FunctionsHttpError')) {
        console.error('HTTP Error from edge function - checking response status');
      }
      if (error.message?.includes('FunctionsRelayError')) {
        console.error('Relay error - network or timeout issue');
      }
      if (error.message?.includes('FunctionsFetchError')) {
        console.error('Fetch error - connection issue');
      }
      
      throw error;
    }
    
    console.log('Transform result:', data);
    return data;
  } catch (edgeFunctionError) {
    console.error('Edge function call failed with full error:', edgeFunctionError);
    console.error('Error properties:', Object.getOwnPropertyNames(edgeFunctionError));
    console.error('Error constructor:', edgeFunctionError.constructor.name);
    
    // Log additional debugging info
    console.error('Supabase client info:', {
      hasAuth: !!supabase.auth,
      authUser: await supabase.auth.getUser()
    });
    
    // Continue with polling - the story might still be processing
    console.log('Continuing with polling despite edge function error...');
    return null;
  }
};

export const pollForStoryCompletion = async (storyId: string, userId: string, updateProgress: (progress: number) => void) => {
  console.log('Starting polling for story completion...');
  let attempts = 0;
  const maxAttempts = 180; // 15 minutes with 5-second intervals
  const startTime = Date.now();
  
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
      console.log('Story pages count:', updatedStory.story_pages?.length || 0);
      
      if (updatedStory.story_pages?.length > 0) {
        const completedPages = updatedStory.story_pages.filter(p => p.transformation_status === 'completed').length;
        const failedPages = updatedStory.story_pages.filter(p => p.transformation_status === 'failed').length;
        const totalPages = updatedStory.total_pages || 0;
        
        console.log(`Pages status: ${completedPages}/${totalPages} completed, ${failedPages} failed`);
      }

      updateProgress(50 + (attempts / maxAttempts) * 45);

      // Check if story is completed, failed, or partially completed
      if (['completed', 'failed', 'partial'].includes(updatedStory.status)) {
        console.log('Story processing completed via polling');
        console.log('Final story status:', updatedStory.status);
        // Clean up temporary images
        await cleanupTempImages(storyId, userId);
        return updatedStory;
      }

      // Wait 5 seconds before next poll
      await new Promise(resolve => setTimeout(resolve, 5000));
      attempts++;
    } catch (pollError) {
      console.error('Polling error:', pollError);
      await new Promise(resolve => setTimeout(resolve, 5000));
      attempts++;
    }
  }
  
  console.error('Story processing timeout after', maxAttempts, 'attempts');
  // Clean up temporary images even on timeout
  await cleanupTempImages(storyId, userId);
  throw new Error('Story processing timeout');
};
