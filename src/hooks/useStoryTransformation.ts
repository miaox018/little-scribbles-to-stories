
import { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface ImageData {
  file: File;
  url: string;
  dataUrl: string;
}

export const useStoryTransformation = () => {
  const [isTransforming, setIsTransforming] = useState(false);
  const { user } = useAuth();
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
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    throw new Error('Story processing timed out after polling');
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

    setIsTransforming(true);
    abortControllerRef.current = new AbortController();

    try {
      const { data: story, error: storyError } = await supabase
        .from('stories')
        .insert({
          user_id: user.id,
          title,
          status: 'draft',
          total_pages: files.length,
          art_style: artStyle
        })
        .select()
        .single();

      if (storyError) throw storyError;

      console.log('Created story:', story);

      const imageData: Array<{url: string, dataUrl: string}> = [];
      
      for (let i = 0; i < files.length; i++) {
        if (abortControllerRef.current?.signal.aborted) {
          throw new Error('Transformation cancelled');
        }

        const file = files[i];
        const url = await uploadImageToStorage(file, story.id, i + 1);
        const dataUrl = await fileToDataUrl(file);
        imageData.push({ url, dataUrl });
      }

      console.log('Uploaded images:', imageData.length);

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
          await pollStoryStatus(story.id);
        }
      } catch (functionError) {
        console.warn('Edge function timeout, switching to polling mode:', functionError);
        await pollStoryStatus(story.id);
      }

      toast({
        title: "Success!",
        description: "Your story has been transformed! Check your library to see the results."
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
      abortControllerRef.current = null;
    }
  };

  return {
    transformStory,
    isTransforming
  };
};
