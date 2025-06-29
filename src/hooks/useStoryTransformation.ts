
import { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useUsageTracking } from '@/hooks/useUsageTracking';
import { toast } from '@/hooks/use-toast';

export interface ImageData {
  file: File;
  url: string;
  dataUrl: string;
}

export const useStoryTransformation = () => {
  const [isTransforming, setIsTransforming] = useState(false);
  const { user } = useAuth();
  const { trackStoryCreation, trackPageUpload, checkCanCreateStory } = useUsageTracking();
  const abortControllerRef = useRef<AbortController | null>(null);

  const uploadImageToStorage = async (file: File, storyId: string, pageNumber: number): Promise<string> => {
    const fileName = `${user?.id}/${storyId}/page_${pageNumber}_${Date.now()}.${file.name.split('.').pop()}`;
    
    const { data, error } = await supabase.storage
      .from('story-images')
      .upload(fileName, file);

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from('story-images')
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  };

  const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const checkStoryStatus = async (storyId: string): Promise<boolean> => {
    const { data: story, error } = await supabase
      .from('stories')
      .select('status, total_pages')
      .eq('id', storyId)
      .single();

    if (error) {
      console.error('Error checking story status:', error);
      return false;
    }

    return story?.status === 'completed' || story?.status === 'partial';
  };

  const pollStoryStatus = async (storyId: string, maxAttempts: number = 60): Promise<void> => {
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      if (abortControllerRef.current?.signal.aborted) {
        throw new Error('Transformation cancelled');
      }

      const isComplete = await checkStoryStatus(storyId);
      
      if (isComplete) {
        console.log('Story processing completed via polling');
        return;
      }

      attempts++;
      // Wait 10 seconds between checks (longer due to rate limiting)
      await new Promise(resolve => setTimeout(resolve, 10000));
    }

    throw new Error('Story processing timed out after polling');
  };

  const cancelTransformation = async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    setIsTransforming(false);
    
    toast({
      title: "Transformation Cancelled",
      description: "Story transformation has been cancelled successfully.",
    });
  };

  const transformStory = async (files: File[], title: string, artStyle: string = 'classic_watercolor') => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create a story",
        variant: "destructive"
      });
      return;
    }

    if (files.length === 0) {
      toast({
        title: "Error", 
        description: "Please upload at least one image",
        variant: "destructive"
      });
      return;
    }

    console.log('Checking if user can create story...');

    // Check if user can create a new story
    try {
      const canCreate = await checkCanCreateStory();
      console.log('Can create story:', canCreate);
      
      if (!canCreate) {
        toast({
          title: "Story Limit Reached",
          description: "You've reached your monthly story limit. Upgrade your plan to create more stories.",
          variant: "destructive"
        });
        return;
      }
    } catch (error) {
      console.error('Error checking story creation limit:', error);
      toast({
        title: "Error",
        description: "Failed to check story limits. Please try again.",
        variant: "destructive"
      });
      return;
    }

    setIsTransforming(true);

    // Create new AbortController for this transformation
    abortControllerRef.current = new AbortController();

    try {
      console.log('Creating story record...');
      
      // Create story record with exact page count
      const { data: story, error: storyError } = await supabase
        .from('stories')
        .insert({
          user_id: user.id,
          title,
          status: 'processing',
          total_pages: files.length,
          art_style: artStyle
        })
        .select()
        .single();

      if (storyError) {
        console.error('Story creation error:', storyError);
        throw storyError;
      }

      console.log('Created story:', story);

      // Track story creation and page uploads
      console.log('Tracking story creation...');
      await trackStoryCreation(story.id);
      
      console.log('Checking page upload limits...');
      const canUploadPages = await trackPageUpload(story.id, files.length);
      
      if (!canUploadPages) {
        console.log('Cannot upload pages, deleting story...');
        // Delete the story if we can't upload the pages
        await supabase.from('stories').delete().eq('id', story.id);
        return;
      }

      console.log('Preparing image data...');
      // Prepare image data
      const imageData: Array<{url: string, dataUrl: string}> = [];
      
      for (let i = 0; i < files.length; i++) {
        // Check if transformation was cancelled
        if (abortControllerRef.current?.signal.aborted) {
          throw new Error('Transformation cancelled');
        }

        const file = files[i];
        const url = await uploadImageToStorage(file, story.id, i + 1);
        const dataUrl = await fileToDataUrl(file);
        imageData.push({ url, dataUrl });
      }

      console.log('Uploaded images:', imageData.length);

      // Show immediate feedback about potential delays
      toast({
        title: "Processing Started",
        description: "Your story is being processed. Due to high demand, this may take longer than usual. Please be patient!",
      });

      // Call the transformation Edge Function
      try {
        console.log('Calling transform-story edge function...');
        const { data: transformResult, error: transformError } = await supabase.functions
          .invoke('transform-story', {
            body: {
              storyId: story.id,
              images: imageData,
              artStyle: artStyle
            }
          });

        if (transformError) {
          console.warn('Edge function call failed, but story may still be processing:', transformError);
          
          toast({
            title: "Processing in Background",
            description: "Your story is being processed. This may take several minutes due to high demand.",
          });

          await pollStoryStatus(story.id, 120); // Increased timeout for rate limiting
        } else {
          console.log('Transform result:', transformResult);
          
          if (transformResult.successful_pages === 0) {
            toast({
              title: "Processing Issues",
              description: "All pages failed to process due to high server demand. Please try again in a few minutes.",
              variant: "destructive"
            });
            return story.id;
          }
        }
      } catch (functionError) {
        console.warn('Edge function timeout, switching to polling mode:', functionError);
        
        toast({
          title: "Processing in Background",
          description: "Your story is being processed. This may take several minutes due to high demand.",
        });

        await pollStoryStatus(story.id, 120); // Increased timeout
      }

      toast({
        title: "✨ Story Ready!",
        description: "Your masterpiece has been transformed and is ready to view!",
      });

      return story.id;

    } catch (error) {
      console.error('Transform story error:', error);
      
      if (error instanceof Error && error.message === 'Transformation cancelled') {
        return;
      }
      
      // Provide more specific error messages
      let errorMessage = "Failed to transform story";
      if (error instanceof Error) {
        if (error.message.includes('rate limit') || error.message.includes('Error 1015')) {
          errorMessage = "The AI service is currently experiencing high demand. Please try again in a few minutes.";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsTransforming(false);
      abortControllerRef.current = null;
    }
  };

  return {
    transformStory,
    cancelTransformation,
    isTransforming
  };
};
