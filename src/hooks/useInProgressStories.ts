
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export const useInProgressStories = () => {
  const [inProgressStories, setInProgressStories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const fetchInProgressStories = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
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
        .eq('user_id', user.id)
        .in('status', ['processing', 'completed', 'partial', 'failed'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInProgressStories(data || []);
    } catch (error) {
      console.error('Error fetching in-progress stories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const regeneratePage = async (pageId: string, storyId: string, artStyle: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('regenerate-page', {
        body: { pageId, storyId, artStyle }
      });

      if (error) throw error;

      // Refresh the stories list
      await fetchInProgressStories();
      
      return data;
    } catch (error) {
      console.error('Error regenerating page:', error);
      throw error;
    }
  };

  const saveStoryToLibrary = async (storyId: string) => {
    try {
      const { error } = await supabase
        .from('stories')
        .update({ status: 'saved' })
        .eq('id', storyId);

      if (error) throw error;

      // Remove from in-progress list
      setInProgressStories(prev => prev.filter(story => story.id !== storyId));
      
      return true;
    } catch (error) {
      console.error('Error saving story to library:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchInProgressStories();
  }, [user]);

  return {
    inProgressStories,
    isLoading,
    regeneratePage,
    saveStoryToLibrary,
    refetch: fetchInProgressStories
  };
};
