
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface TransformationState {
  isTransforming: boolean;
  transformedStory: any | null;
  error: string | null;
  progress: number;
}

export const useStoryTransformation = () => {
  const [state, setState] = useState<TransformationState>({
    isTransforming: false,
    transformedStory: null,
    error: null,
    progress: 0,
  });
  
  const { user } = useAuth();

  const transformStory = useCallback(async (
    title: string,
    images: File[],
    artStyle: string = 'classic_watercolor'
  ) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to transform your story.",
        variant: "destructive"
      });
      return;
    }

    setState(prev => ({ ...prev, isTransforming: true, error: null, progress: 0 }));

    try {
      console.log('Checking if user can create story...');
      
      // Check if user can create more stories using the database function
      const { data: canCreate } = await supabase.rpc('can_create_story', {
        user_id_param: user.id
      });

      console.log('Can create story:', canCreate);
      
      if (!canCreate) {
        throw new Error('Story limit reached. Please upgrade your plan.');
      }

      console.log('Creating story record...');
      
      // Create story record
      const { data: story, error: storyError } = await supabase
        .from('stories')
        .insert({
          user_id: user.id,
          title,
          status: 'processing',
          art_style: artStyle,
          total_pages: images.length
        })
        .select()
        .single();

      if (storyError) throw storyError;
      console.log('Created story:', story);

      console.log('Tracking story creation...');
      
      // Track story creation in monthly_usage table
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
      
      const { data: existingUsage } = await supabase
        .from('monthly_usage')
        .select('stories_created')
        .eq('user_id', user.id)
        .eq('month_year', currentMonth)
        .single();

      if (existingUsage) {
        await supabase
          .from('monthly_usage')
          .update({
            stories_created: existingUsage.stories_created + 1,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id)
          .eq('month_year', currentMonth);
      } else {
        await supabase
          .from('monthly_usage')
          .insert({
            user_id: user.id,
            month_year: currentMonth,
            stories_created: 1,
            total_pages_uploaded: images.length,
            total_pages_regenerated: 0
          });
      }

      console.log('Checking page upload limits...');
      
      // Check page upload limits using database function
      const { data: canUpload } = await supabase.rpc('can_upload_pages', {
        user_id_param: user.id,
        story_id_param: story.id,
        additional_pages: images.length
      });

      if (!canUpload) {
        throw new Error('Page upload limit exceeded. Please upgrade your plan.');
      }

      console.log('Preparing image data...');
      
      // Convert images to base64 data URLs
      const imageDataArray = await Promise.all(
        images.map(async (file, index) => {
          return new Promise((resolve, reject) => {
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

      setState(prev => ({ ...prev, progress: 20 }));

      console.log('Calling transform-story edge function...');
      
      // Call edge function to transform story
      let transformResult;
      try {
        const { data, error } = await supabase.functions.invoke('transform-story', {
          body: {
            storyId: story.id,
            images: imageDataArray,
            artStyle
          }
        });

        if (error) throw error;
        transformResult = data;
        console.log('Transform result:', transformResult);
      } catch (edgeFunctionError) {
        console.log('Edge function call failed, but story may still be processing:', edgeFunctionError);
        // Continue with polling - the story might still be processing
      }

      setState(prev => ({ ...prev, progress: 50 }));

      // Start polling for story completion
      console.log('Starting polling for story completion...');
      const pollForCompletion = async (): Promise<any> => {
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
              .eq('id', story.id)
              .single();

            if (error) throw error;

            setState(prev => ({ 
              ...prev, 
              progress: 50 + (attempts / maxAttempts) * 45 
            }));

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

      const completedStory = await pollForCompletion();
      
      setState(prev => ({ 
        ...prev, 
        progress: 100, 
        transformedStory: completedStory,
        isTransforming: false 
      }));

      // Track page uploads in usage_tracking table
      await supabase
        .from('usage_tracking')
        .upsert({
          user_id: user.id,
          story_id: story.id,
          month_year: currentMonth,
          pages_uploaded: images.length,
          pages_regenerated: 0
        });

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
  }, [user]);

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
