import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseInProgressStoriesRealtimeProps {
  userId: string | null;
  onStoryChange: () => void;
}

export const useInProgressStoriesRealtime = ({ 
  userId, 
  onStoryChange 
}: UseInProgressStoriesRealtimeProps) => {
  useEffect(() => {
    if (!userId) return;

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
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('Story update received:', payload);
          onStoryChange();
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
          onStoryChange();
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up real-time subscriptions...');
      supabase.removeChannel(storyChannel);
      supabase.removeChannel(pageChannel);
    };
  }, [userId, onStoryChange]);
};