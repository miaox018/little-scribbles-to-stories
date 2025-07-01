import { useState, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import type { TransformationState } from './story-transformation/types';
import { validateStoryCreation, validatePageUpload, validateUserAuthentication } from './story-transformation/validation';
import { createStoryRecord, convertImagesToDataUrls, callTransformStoryFunction, pollForStoryCompletion } from './story-transformation/story-operations';
import { trackStoryCreation, trackPageUploads } from './story-transformation/usage-tracking';

export const useStoryTransformation = () => {
  const [state, setState] = useState<TransformationState>({
    isTransforming: false,
    transformedStory: null,
    error: null,
    progress: 0,
  });
  
  const { user } = useAuth();

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

    // Show encouraging message immediately
    toast({
      title: "Great art takes time! 🎨✨",
      description: "Your masterpiece is being crafted as we speak. Once it's ready, you can review it anytime in the 'My Library' tab!",
      duration: 6000,
    });

    try {
      await validateStoryCreation(user!.id);
      
      const story = await createStoryRecord(user!.id, title, artStyle, images.length);
      
      await trackStoryCreation(user!.id, images.length);
      
      await validatePageUpload(user!.id, story.id, images.length);

      const imageDataArray = await convertImagesToDataUrls(images);
      
      setState(prev => ({ ...prev, progress: 20 }));

      // Start the transformation process in the background
      await callTransformStoryFunction(story.id, imageDataArray, artStyle);
      
      setState(prev => ({ ...prev, progress: 50 }));

      // Show immediate feedback and redirect to library
      toast({
        title: "Story Started! 📚",
        description: `"${title}" is now processing in the background. Check your library to see the progress!`,
        duration: 4000,
      });

      // Dispatch event to switch to library tab
      window.dispatchEvent(new CustomEvent('storyProcessingStarted'));

      // Reset the transformation state but keep story info for potential redirect
      // Ensure story_pages is always an array to prevent the sorting error
      const storyWithPages = { 
        ...story, 
        status: 'processing',
        story_pages: [] // Initialize as empty array
      };
      
      setState(prev => ({ 
        ...prev, 
        progress: 0, 
        transformedStory: storyWithPages,
        isTransforming: false 
      }));

      await trackPageUploads(user!.id, story.id, images.length);

      // Return story info immediately instead of waiting for completion
      return storyWithPages;

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
