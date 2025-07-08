import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { inProgressStoriesService, type InProgressStory } from '@/services/inProgressStoriesService';
import { useInProgressStoriesRealtime } from './useInProgressStoriesRealtime';
import { usePeriodicRefresh } from './usePeriodicRefresh';

export const useInProgressStories = () => {
  const [inProgressStories, setInProgressStories] = useState<InProgressStory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const fetchInProgressStories = useCallback(async () => {
    if (!user) return;

    try {
      const stories = await inProgressStoriesService.fetchInProgressStories(user.id);
      setInProgressStories(stories);
    } catch (error) {
      console.error('Error fetching in-progress stories:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const cancelStory = async (storyId: string) => {
    try {
      await inProgressStoriesService.cancelStory(storyId);
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
      await inProgressStoriesService.cancelAllProcessingStories(
        processingStories.map(story => story.id)
      );
      
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
      const data = await inProgressStoriesService.regeneratePage(pageId, storyId, artStyle);
      // Refresh the stories list
      await fetchInProgressStories();
      return data;
    } catch (error) {
      console.error('Error regenerating page:', error);
      throw error;
    }
  };

  const deleteStory = async (storyId: string) => {
    try {
      await inProgressStoriesService.deleteStory(storyId);
      // Remove from in-progress list immediately
      setInProgressStories(prev => prev.filter(story => story.id !== storyId));
      return true;
    } catch (error) {
      console.error('Error deleting story:', error);
      throw error;
    }
  };

  const saveStoryToLibrary = async (storyId: string) => {
    try {
      await inProgressStoriesService.saveStoryToLibrary(storyId);
      // Remove from in-progress list
      setInProgressStories(prev => prev.filter(story => story.id !== storyId));
      return true;
    } catch (error) {
      console.error('Error saving story to library:', error);
      throw error;
    }
  };

  // Set up real-time subscriptions
  useInProgressStoriesRealtime({
    userId: user?.id || null,
    onStoryChange: fetchInProgressStories
  });

  // Set up periodic refresh
  usePeriodicRefresh({
    stories: inProgressStories,
    onRefresh: fetchInProgressStories
  });

  // Initial fetch
  useEffect(() => {
    fetchInProgressStories();
  }, [fetchInProgressStories]);

  return {
    inProgressStories,
    isLoading,
    cancelStory,
    cancelAllProcessingStories,
    deleteStory,
    regeneratePage,
    saveStoryToLibrary,
    refetch: fetchInProgressStories
  };
};
