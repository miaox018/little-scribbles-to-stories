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
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
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

    return story?.status === 'completed';
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
      // Wait 5 seconds between checks
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    throw new Error('Story processing timed out after polling');
  };

  const cancelTransformation = async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    setIsTransforming(false);
    setCurrentPage(0);
    setTotalPages(0);
    
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

    // Check if user can create a new story
    const canCreate = await checkCanCreateStory();
    if (!canCreate) {
      toast({
        title: "Story Limit Reached",
        description: "You've reached your monthly story limit. Upgrade your plan to create more stories.",
        variant: "destructive"
      });
      return;
    }

    setIsTransforming(true);
    setCurrentPage(0);
    setTotalPages(files.length + 1); // +1 for memory collage

    // Create new AbortController for this transformation
    abortControllerRef.current = new AbortController();

    try {
      // Create story record with 'processing' status (not saved to library yet)
      const { data: story, error: storyError } = await supabase
        .from('stories')
        .insert({
          user_id: user.id,
          title,
          status: 'processing', // Start as processing, not draft
          total_pages: files.length + 1,
          art_style: artStyle
        })
        .select()
        .single();

      if (storyError) throw storyError;

      console.log('Created story:', story);

      // Track story creation and page uploads
      await trackStoryCreation(story.id);
      const canUploadPages = await trackPageUpload(story.id, files.length);
      
      if (!canUploadPages) {
        // Delete the story if we can't upload the pages
        await supabase.from('stories').delete().eq('id', story.id);
        return;
      }

      // Prepare image data
      const imageData: Array<{url: string, dataUrl: string}> = [];
      
      for (let i = 0; i < files.length; i++) {
        // Check if transformation was cancelled
        if (abortControllerRef.current?.signal.aborted) {
          throw new Error('Transformation cancelled');
        }

        setCurrentPage(i + 1);
        const file = files[i];
        const url = await uploadImageToStorage(file, story.id, i + 1);
        const dataUrl = await fileToDataUrl(file);
        imageData.push({ url, dataUrl });
      }

      console.log('Uploaded images:', imageData.length);

      // Call the transformation Edge Function
      try {
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
            title: "Processing Started",
            description: "Your story is being processed. This may take several minutes for complex art styles.",
          });

          await pollStoryStatus(story.id);
        }
      } catch (functionError) {
        console.warn('Edge function timeout, switching to polling mode:', functionError);
        
        toast({
          title: "Processing in Background",
          description: "Your story is being processed. This may take several minutes. We'll check the status automatically.",
        });

        await pollStoryStatus(story.id);
      }

      toast({
        title: "Success!",
        description: "Your story has been transformed! Check 'In Progress' to review and save it to your library."
      });

      return story.id;

    } catch (error) {
      console.error('Transform story error:', error);
      
      if (error instanceof Error && error.message === 'Transformation cancelled') {
        return;
      }
      
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to transform story",
        variant: "destructive"
      });
    } finally {
      setIsTransforming(false);
      setCurrentPage(0);
      setTotalPages(0);
      abortControllerRef.current = null;
    }
  };

  return {
    transformStory,
    cancelTransformation,
    isTransforming,
    currentPage,
    totalPages
  };
};
