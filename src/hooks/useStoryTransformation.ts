
import { useState, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import type { TransformationState } from './story-transformation/types';
import { validateStoryCreation, validatePageUpload, validateUserAuthentication } from './story-transformation/validation';
import { createStoryRecord, uploadImagesAndGetUrls, callTransformStoryFunction, pollForStoryCompletion } from './story-transformation/story-operations';
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

    try {
      await validateStoryCreation(user!.id);
      
      const story = await createStoryRecord(user!.id, title, artStyle, images.length);
      
      await trackStoryCreation(user!.id, images.length);
      
      await validatePageUpload(user!.id, story.id, images.length);

      // Upload images to storage and get URLs
      const imageUrls = await uploadImagesAndGetUrls(images, story.id, user!.id);
      
      setState(prev => ({ ...prev, progress: 20 }));

      const result = await callTransformStoryFunction(story.id, imageUrls, artStyle);
      
      setState(prev => ({ ...prev, progress: 50 }));

      // Handle different processing modes
      if (images.length > 3) {
        // Background processing mode
        console.log('Large story - switching to background processing mode');
        
        setState(prev => ({ 
          ...prev, 
          progress: 100, 
          isTransforming: false 
        }));

        await trackPageUploads(user!.id, story.id, images.length);

        toast({
          title: "Story Processing Started! 🚀",
          description: `Your ${images.length}-page story is being processed in the background. Check "Stories In Progress" for updates!`,
          duration: 8000,
        });

        // Return a partial story object for background processing
        return {
          ...story,
          status: 'processing',
          story_pages: []
        };
      } else {
        // Synchronous processing mode - continue with polling
        const completedStory = await pollForStoryCompletion(story.id, user!.id, updateProgress);
        
        setState(prev => ({ 
          ...prev, 
          progress: 100, 
          transformedStory: completedStory,
          isTransforming: false 
        }));

        await trackPageUploads(user!.id, story.id, images.length);

        if (completedStory.status === 'completed') {
          toast({
            title: "Story Transformed! ✨",
            description: `Your story "${title}" has been magically transformed!`,
          });
        } else if (completedStory.status === 'partial') {
          toast({
            title: "Story Partially Complete",
            description: "Some pages were transformed successfully. You can regenerate failed pages.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Story Transformation Failed",
            description: "We couldn't transform your story. Please try again with different images.",
            variant: "destructive"
          });
        }

        return completedStory;
      }

    } catch (error: any) {
      console.error('Story transformation error:', error);
      setState(prev => ({ 
        ...prev, 
        isTransforming: false, 
        error: error.message,
        progress: 0
      }));
      
      // Don't show error toast for background processing messages
      if (!error.message?.includes('background')) {
        toast({
          title: "Transformation Failed",
          description: error.message || "Something went wrong. Please try again.",
          variant: "destructive"
        });
      }
      
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
