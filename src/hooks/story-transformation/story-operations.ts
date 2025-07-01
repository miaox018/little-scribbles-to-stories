
import { supabase } from '@/integrations/supabase/client';
import type { ImageData } from './types';

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

export const convertImagesToDataUrls = async (images: File[]): Promise<ImageData[]> => {
  console.log('Preparing image data...');
  
  const imageDataArray = await Promise.all(
    images.map(async (file, index) => {
      return new Promise<ImageData>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve({
          dataUrl: reader.result as string,
          pageNumber: index + 1
        });
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    })
  );

  console.log('Uploaded images:', imageDataArray.length);
  return imageDataArray;
};

export const callTransformStoryFunction = async (storyId: string, imageDataArray: ImageData[], artStyle: string) => {
  console.log('=== CLIENT SIDE EDGE FUNCTION CALL ===');
  console.log('Story ID:', storyId);
  console.log('Images count:', imageDataArray.length);
  console.log('Art style:', artStyle);
  console.log('Sample image data structure:', {
    hasDataUrl: !!imageDataArray[0]?.dataUrl,
    dataUrlLength: imageDataArray[0]?.dataUrl?.length,
    dataUrlPrefix: imageDataArray[0]?.dataUrl?.substring(0, 50),
    pageNumber: imageDataArray[0]?.pageNumber
  });
  
  const payload = {
    storyId: storyId,
    images: imageDataArray,
    artStyle
  };
  
  console.log('Full payload structure:', {
    storyId: typeof payload.storyId,
    images: Array.isArray(payload.images) ? `array[${payload.images.length}]` : typeof payload.images,
    artStyle: typeof payload.artStyle
  });
  
  console.log('Payload JSON string length:', JSON.stringify(payload).length);
  
  try {
    console.log('Calling supabase.functions.invoke...');
    const { data, error } = await supabase.functions.invoke('transform-story', {
      body: payload
    });

    if (error) {
      console.error('Edge function error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack,
        context: error.context
      });
      throw error;
    }
    console.log('Transform result:', data);
    return data;
  } catch (edgeFunctionError) {
    console.error('Edge function call failed with full error:', edgeFunctionError);
    console.error('Error properties:', Object.getOwnPropertyNames(edgeFunctionError));
    // Continue with polling - the story might still be processing
    return null;
  }
};

export const pollForStoryCompletion = async (storyId: string, updateProgress: (progress: number) => void) => {
  console.log('Starting polling for story completion...');
  let attempts = 0;
  const maxAttempts = 180; // 15 minutes with 5-second intervals
  
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
  
  throw new Error('Story processing timeout');
};
