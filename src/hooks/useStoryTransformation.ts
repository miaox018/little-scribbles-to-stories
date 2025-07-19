
import { useState, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useStoryCleanup } from './useStoryCleanup';
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
  const { cleanupStuckStories } = useStoryCleanup();

  // Always define all hooks at the top level
  const updateProgress = useCallback((progress: number) => {
    setState(prev => ({ ...prev, progress }));
  }, []);

  const resetTransformation = useCallback(() => {
    setState({
      isTransforming: false,
      transformedStory: null,
      error: null,
      progress: 0,
    });
  }, []);

  const transformStory = useCallback(async (
    title: string,
    images: File[],
    artStyle: string = 'classic_watercolor'
  ) => {
    console.log('=== STORY TRANSFORMATION STARTED ===');
    console.log('Title:', title);
    console.log('Images count:', images.length);
    console.log('Art style:', artStyle);
    console.log('User ID:', user?.id);
    
    // Early validation to prevent hook violations
    if (!user?.id) {
      const errorMsg = 'Please sign in to transform stories.';
      setState(prev => ({ ...prev, error: errorMsg }));
      toast({
        title: "Authentication Required",
        description: errorMsg,
        variant: "destructive"
      });
      throw new Error(errorMsg);
    }

    setState(prev => ({ ...prev, isTransforming: true, error: null, progress: 0 }));

    try {
      // Clean up any stuck stories first
      await cleanupStuckStories();

      console.log('Validating story creation permissions...');
      await validateStoryCreation(user.id);
      
      console.log('Creating story record...');
      const story = await createStoryRecord(user.id, title, artStyle, images.length);
      console.log('Story created with ID:', story.id);
      
      console.log('Tracking story creation...');
      await trackStoryCreation(user.id, images.length);
      
      console.log('Validating page upload permissions...');
      await validatePageUpload(user.id, story.id, images.length);

      console.log('Uploading images to storage...');
      const imageUrls = await uploadImagesAndGetUrls(images, story.id, user.id);
      console.log('Images uploaded successfully:', imageUrls.length);
      
      setState(prev => ({ ...prev, progress: 20 }));

      console.log('Calling transform story edge function...');
      const edgeFunctionResult = await callTransformStoryFunction(story.id, imageUrls, artStyle);
      console.log('Edge function result:', edgeFunctionResult);
      
      setState(prev => ({ ...prev, progress: 50 }));

      console.log('Starting enhanced polling for completion...');
      const completedStory = await pollForStoryCompletion(story.id, user.id, updateProgress);
      console.log('Story transformation completed:', completedStory.status);
      
      setState(prev => ({ 
        ...prev, 
        progress: 100, 
        transformedStory: completedStory,
        isTransforming: false 
      }));

      await trackPageUploads(user.id, story.id, images.length);

      // Enhanced success/failure notifications
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
          description: completedStory.description || "We couldn't transform your story. Please try again with different images.",
          variant: "destructive"
        });
      }

      return completedStory;

    } catch (error: any) {
      console.error('=== STORY TRANSFORMATION ERROR ===');
      console.error('Error details:', error);
      
      setState(prev => ({ 
        ...prev, 
        isTransforming: false, 
        error: error.message,
        progress: 0
      }));
      
      // Enhanced error categorization and user messaging
      let errorMessage = "Something went wrong. Please try again.";
      
      if (error.message?.includes('Service configuration')) {
        errorMessage = "Service is temporarily unavailable due to a configuration issue. Please try again in a few minutes.";
      } else if (error.message?.includes('Transform service is temporarily unavailable')) {
        errorMessage = "Transform service is currently down. Please try again later.";
      } else if (error.message?.includes('Processing is taking longer')) {
        errorMessage = "Processing is taking longer than expected. Please try again.";
      } else if (error.message?.includes('got stuck')) {
        errorMessage = "Processing got stuck. Please try again with different images or fewer pages.";
      } else if (error.message?.includes('timed out')) {
        errorMessage = "Processing timed out. This may be due to high server load. Please try again.";
      } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
        errorMessage = "Network error. Please check your connection and try again.";
      } else if (error.message?.includes('permission') || error.message?.includes('unauthorized')) {
        errorMessage = "Permission denied. Please sign in and try again.";
      } else if (error.message?.includes('limit')) {
        errorMessage = "You've reached your story limit. Please upgrade your plan.";
      }
      
      toast({
        title: "Transformation Failed",
        description: errorMessage,
        variant: "destructive"
      });
      
      throw error;
    }
  }, [user, updateProgress, cleanupStuckStories]);

  return {
    ...state,
    transformStory,
    resetTransformation,
  };
};
