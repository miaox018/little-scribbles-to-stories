
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
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const { user } = useAuth();
  const abortControllerRef = useRef<AbortController | null>(null);

  const uploadImageToStorage = async (file: File, storyId: string, pageNumber: number): Promise<string> => {
    console.log('Uploading image to storage:', { storyId, pageNumber, fileName: file.name });
    
    const fileName = `${user?.id}/${storyId}/page_${pageNumber}_${Date.now()}.${file.name.split('.').pop()}`;
    
    const { data, error } = await supabase.storage
      .from('story-images')
      .upload(fileName, file);

    if (error) {
      console.error('Storage upload error:', error);
      throw error;
    }

    const { data: urlData } = supabase.storage
      .from('story-images')
      .getPublicUrl(fileName);

    console.log('Upload successful, public URL:', urlData.publicUrl);
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

  const cancelTransformation = async () => {
    console.log('Cancelling transformation...');
    
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
    console.log('Starting story transformation:', { filesCount: files.length, title, artStyle, user: user?.id });

    if (!user) {
      console.error('No user found');
      toast({
        title: "Error",
        description: "You must be logged in to create a story",
        variant: "destructive"
      });
      return;
    }

    if (files.length === 0) {
      console.error('No files provided');
      toast({
        title: "Error", 
        description: "Please upload at least one image",
        variant: "destructive"
      });
      return;
    }

    setIsTransforming(true);
    setCurrentPage(0);
    setTotalPages(files.length);

    // Create new AbortController for this transformation
    abortControllerRef.current = new AbortController();

    try {
      console.log('Creating story record...');
      
      // Create story record
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

      if (storyError) {
        console.error('Story creation error:', storyError);
        throw storyError;
      }

      console.log('Story created successfully:', story);

      // Prepare image data
      const imageData: Array<{url: string, dataUrl: string}> = [];
      
      for (let i = 0; i < files.length; i++) {
        // Check if transformation was cancelled
        if (abortControllerRef.current?.signal.aborted) {
          throw new Error('Transformation cancelled');
        }

        console.log(`Processing file ${i + 1}/${files.length}`);
        setCurrentPage(i + 1);
        
        const file = files[i];
        const url = await uploadImageToStorage(file, story.id, i + 1);
        const dataUrl = await fileToDataUrl(file);
        imageData.push({ url, dataUrl });
      }

      console.log('All images uploaded, calling edge function...');

      // Call the transformation Edge Function with cancellation support
      const { data: transformResult, error: transformError } = await supabase.functions
        .invoke('transform-story', {
          body: {
            storyId: story.id,
            images: imageData,
            artStyle: artStyle
          }
        });

      if (transformError) {
        console.error('Transform function error:', transformError);
        throw transformError;
      }

      console.log('Transformation completed successfully:', transformResult);

      toast({
        title: "Success!",
        description: "Your story has been transformed! Check your library to see the results."
      });

      return story.id;

    } catch (error) {
      console.error('Transform story error:', error);
      
      if (error instanceof Error && error.message === 'Transformation cancelled') {
        // Don't show error toast for user-initiated cancellation
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
