
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
  console.log('Preparing image data by uploading normalized images to storage...');
  
  const imageData = await uploadImagesToStorage(images, storyId, userId);
  console.log('Images normalized and uploaded to storage:', imageData.length);
  
  // Convert to format expected by new pipeline
  return imageData.map(data => ({
    originalUrl: data.originalUrl,
    normalizedUrl: data.normalizedUrl,
    thumbnailUrl: data.thumbnailUrl,
    pageNumber: data.pageNumber
  }));
};

export const createJobAndStartProcessing = async (storyId: string, imageUrls: any[], artStyle: string, userId: string) => {
  console.log('=== NEW JOB-BASED PROCESSING ===');
  console.log('Story ID:', storyId);
  console.log('Images count:', imageUrls.length);
  console.log('Art style:', artStyle);
  
  // Create processing job
  const { data: job, error: jobError } = await supabase
    .from('story_processing_jobs')
    .insert({
      story_id: storyId,
      user_id: userId,
      job_type: 'full_story',
      total_pages: imageUrls.length,
      status: 'pending'
    })
    .select()
    .single();

  if (jobError) {
    console.error('Failed to create job:', jobError);
    throw jobError;
  }

  console.log('Created job:', job.id);

  // Start background processing
  try {
    const { error: processError } = await supabase.functions.invoke('process-story-job', {
      body: { jobId: job.id }
    });

    if (processError) {
      console.error('Failed to start job processing:', processError);
      // Mark job as failed
      await supabase
        .from('story_processing_jobs')
        .update({ status: 'failed', error_message: processError.message })
        .eq('id', job.id);
      throw processError;
    }

    console.log('Job processing started successfully');
    return { jobId: job.id, status: 'processing' };
    
  } catch (processError) {
    console.error('Error starting background processing:', processError);
    // Mark job as failed
    await supabase
      .from('story_processing_jobs')
      .update({ status: 'failed', error_message: processError.message })
      .eq('id', job.id);
    throw processError;
  }
};

export const pollForStoryCompletion = async (storyId: string, userId: string, updateProgress: (progress: number) => void) => {
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
  
  // Clean up temporary images even on timeout
  await cleanupTempImages(storyId, userId);
  throw new Error('Story processing timeout');
};
