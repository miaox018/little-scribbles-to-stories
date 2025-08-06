
import { useState, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import type { TransformationState } from './story-transformation/types';
import { validateStoryCreation, validatePageUpload, validateUserAuthentication } from './story-transformation/validation';
import { createStoryRecord, uploadImagesAndGetUrls, createJobAndStartProcessing } from './story-transformation/story-operations';
import { trackStoryCreation, trackPageUploads } from './story-transformation/usage-tracking';
import { useJobQueue } from './useJobQueue';

export const useStoryTransformation = () => {
  const [state, setState] = useState<TransformationState>({
    isTransforming: false,
    transformedStory: null,
    error: null,
    progress: 0,
  });
  
  const { user } = useAuth();
  const { jobs } = useJobQueue();

  const updateProgress = useCallback((progress: number) => {
    setState(prev => ({ ...prev, progress }));
  }, []);

  const transformStory = useCallback(async (
    title: string,
    images: File[],
    artStyle: string = 'classic_watercolor'
  ) => {
    validateUserAuthentication(user);

    setState(prev => ({ ...prev, isTransforming: true, error: null, progress: 0 }));

    try {
      await validateStoryCreation(user!.id);
      
      const story = await createStoryRecord(user!.id, title, artStyle, images.length);
      
      await trackStoryCreation(user!.id, images.length);
      
      await validatePageUpload(user!.id, story.id, images.length);

      // Upload and normalize images
      const imageUrls = await uploadImagesAndGetUrls(images, story.id, user!.id);
      
      setState(prev => ({ ...prev, progress: 30 }));

      // Create story pages from uploaded images
      for (const imageData of imageUrls) {
        await supabase.from('story_pages').insert({
          story_id: story.id,
          page_number: imageData.pageNumber,
          original_image_url: imageData.normalizedUrl, // Use normalized for processing
          transformation_status: 'pending'
        });
      }

      // Start job-based processing
      const jobResult = await createJobAndStartProcessing(story.id, imageUrls, artStyle, user!.id);
      
      setState(prev => ({ 
        ...prev, 
        progress: 50,
        transformedStory: { 
          ...story, 
          status: 'processing',
          jobId: jobResult.jobId 
        },
        isTransforming: false 
      }));

      await trackPageUploads(user!.id, story.id, images.length);

      toast({
        title: "Story Processing Started! ⚡",
        description: `Your story "${title}" is being transformed. You'll see progress updates in real-time.`,
      });

      return { 
        ...story, 
        status: 'processing',
        jobId: jobResult.jobId 
      };

    } catch (error: any) {
      console.error('Story transformation error:', error);
      setState(prev => ({ 
        ...prev, 
        isTransforming: false, 
        error: error.message,
        progress: 0
      }));
      
      toast({
        title: "Transformation Failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive"
      });
      
      throw error;
    }
  }, [user, updateProgress]);

  const resetTransformation = useCallback(() => {
    setState({
      isTransforming: false,
      transformedStory: null,
      error: null,
      progress: 0,
    });
  }, []);

  return {
    ...state,
    transformStory,
    resetTransformation,
  };
};
