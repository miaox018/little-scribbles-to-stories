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
      console.log('Fetching in-progress stories...');
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
        .in('status', ['processing', 'completed', 'failed']) // Removed 'partial' to match DB constraint
        .neq('status', 'saved') // Use status-based filtering instead of description
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      console.log('Fetched in-progress stories:', data?.length || 0);
      setInProgressStories(data || []);
    } catch (error) {
      console.error('Error fetching in-progress stories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const cancelStory = async (storyId: string) => {
    try {
      const { error } = await supabase
        .from('stories')
        .update({ 
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          description: 'Story processing was cancelled by user'
        })
        .eq('id', storyId);

      if (error) throw error;

      // Remove from in-progress list immediately
      setInProgressStories(prev => prev.filter(story => story.id !== storyId));
      
      return true;
    } catch (error) {
      console.error('Error cancelling story:', error);
      throw error;
    }
  };

  const cancelAllProcessingStories = async () => {
    try {
      const processingStories = inProgressStories.filter(story => story.status === 'processing');
      
      const { error } = await supabase
        .from('stories')
        .update({ 
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          description: 'Story processing was cancelled by user (bulk cancel)'
        })
        .in('id', processingStories.map(story => story.id));

      if (error) throw error;

      // Remove all processing stories from the list
      setInProgressStories(prev => prev.filter(story => story.status !== 'processing'));
      
      return processingStories.length;
    } catch (error) {
      console.error('Error cancelling all stories:', error);
      throw error;
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
        .update({ 
          status: 'saved', // Use proper status instead of description-based filtering
          updated_at: new Date().toISOString()
        })
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

  // Set up real-time subscription for story updates
  useEffect(() => {
    if (!user) return;

    console.log('Setting up real-time subscription for stories...');
    
    // Subscribe to story changes
    const storyChannel = supabase
      .channel('story-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'stories',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Story update received:', payload);
          // Refetch stories when any story changes
          fetchInProgressStories();
        }
      )
      .subscribe();

    // Subscribe to story page changes
    const pageChannel = supabase
      .channel('story-page-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'story_pages'
        },
        (payload) => {
          console.log('Story page update received:', payload);
          // Refetch stories when pages change
          fetchInProgressStories();
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up real-time subscriptions...');
      supabase.removeChannel(storyChannel);
      supabase.removeChannel(pageChannel);
    };
  }, [user]);

  // Initial fetch and periodic refresh
  useEffect(() => {
    fetchInProgressStories();
    
    // Set up periodic refresh for processing stories
    const interval = setInterval(() => {
      const hasProcessingStories = inProgressStories.some(story => story.status === 'processing');
      if (hasProcessingStories) {
        console.log('Refreshing in-progress stories (periodic)...');
        fetchInProgressStories();
      }
    }, 15000); // Check every 15 seconds instead of 30
    
    return () => clearInterval(interval);
  }, [user, inProgressStories]);

  return {
    inProgressStories,
    isLoading,
    cancelStory,
    cancelAllProcessingStories,
    regeneratePage,
    saveStoryToLibrary,
    refetch: fetchInProgressStories
  };
};
