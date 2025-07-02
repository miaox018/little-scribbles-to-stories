
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
    const { data, error } = await supabase.functions.invoke('transform-story', {
      body: payload
    });

    if (error) {
      console.error('Edge function error details:', error);
      throw error;
    }
    console.log('Transform result:', data);
    return data;
  } catch (edgeFunctionError) {
    console.error('Edge function call failed:', edgeFunctionError);
    // For background processing mode, this might be expected
    return null;
  }
};

export const pollForStoryCompletion = async (storyId: string, userId: string, updateProgress: (progress: number) => void) => {
  console.log('Starting polling for story completion...');
  let attempts = 0;
  const maxAttempts = 60; // Reduced from 180 to 5 minutes max polling
  
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

      updateProgress(50 + (attempts / maxAttempts) * 45);

      // Check if story is completed, failed, or partially completed
      if (['completed', 'failed', 'partial'].includes(updatedStory.status)) {
        console.log('Story processing completed via polling');
        // Clean up temporary images
        await cleanupTempImages(storyId, userId);
        return updatedStory;
      }

      // For background processing, exit polling earlier and let user check progress later
      if (updatedStory.total_pages > 3 && attempts > 10) {
        console.log('Background processing detected, exiting polling early');
        throw new Error('Story is being processed in the background. Please check "Stories In Progress" for updates.');
      }

      // Wait 5 seconds before next poll
      await new Promise(resolve => setTimeout(resolve, 5000));
      attempts++;
    } catch (pollError) {
      console.error('Polling error:', pollError);
      
      // If it's a background processing message, throw it up
      if (pollError.message?.includes('background')) {
        throw pollError;
      }
      
      await new Promise(resolve => setTimeout(resolve, 5000));
      attempts++;
    }
  }
  
  // Clean up temporary images even on timeout
  await cleanupTempImages(storyId, userId);
  throw new Error('Story processing timeout. Please check "Stories In Progress" for updates.');
};
