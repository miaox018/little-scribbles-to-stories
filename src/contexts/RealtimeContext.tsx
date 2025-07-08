
import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

interface RealtimeContextType {
  refreshInProgressStories: () => void;
  subscribeToStoryChanges: (callback: () => void) => () => void;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

export const useRealtime = () => {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error('useRealtime must be used within a RealtimeProvider');
  }
  return context;
};

export const RealtimeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [storyChangeCallbacks, setStoryChangeCallbacks] = useState<(() => void)[]>([]);
  const subscriptionsRef = useRef<{ story: any; page: any } | null>(null);
  const userIdRef = useRef<string | null>(null);

  const refreshInProgressStories = useCallback(() => {
    storyChangeCallbacks.forEach(callback => callback());
  }, [storyChangeCallbacks]);

  const subscribeToStoryChanges = useCallback((callback: () => void) => {
    setStoryChangeCallbacks(prev => [...prev, callback]);
    
    return () => {
      setStoryChangeCallbacks(prev => prev.filter(cb => cb !== callback));
    };
  }, []);

  useEffect(() => {
    // Only set up subscriptions if user exists and has changed, or if no subscriptions exist
    if (!user || (userIdRef.current === user.id && subscriptionsRef.current)) {
      return;
    }

    // Clean up existing subscriptions if user changed
    if (subscriptionsRef.current && userIdRef.current !== user.id) {
      console.log('Cleaning up subscriptions for user change...');
      supabase.removeChannel(subscriptionsRef.current.story);
      supabase.removeChannel(subscriptionsRef.current.page);
      subscriptionsRef.current = null;
    }

    console.log('Setting up global real-time subscription for user:', user.id);
    userIdRef.current = user.id;
    
    const storyChannelName = `story-changes-${user.id}`;
    const pageChannelName = `story-page-changes-${user.id}`;

    try {
      // Subscribe to story changes
      const storyChannel = supabase
        .channel(storyChannelName)
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
            refreshInProgressStories();
          }
        );

      // Subscribe to story page changes
      const pageChannel = supabase
        .channel(pageChannelName)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'story_pages'
          },
          (payload) => {
            console.log('Story page update received:', payload);
            refreshInProgressStories();
          }
        );

      // Subscribe both channels
      Promise.all([
        storyChannel.subscribe(),
        pageChannel.subscribe()
      ]).then(() => {
        console.log('Real-time subscriptions established');
        subscriptionsRef.current = {
          story: storyChannel,
          page: pageChannel
        };
      }).catch((error) => {
        console.error('Failed to subscribe to real-time channels:', error);
      });

    } catch (error) {
      console.error('Error setting up real-time subscriptions:', error);
    }

    return () => {
      console.log('Cleaning up global real-time subscriptions...');
      if (subscriptionsRef.current) {
        supabase.removeChannel(subscriptionsRef.current.story);
        supabase.removeChannel(subscriptionsRef.current.page);
        subscriptionsRef.current = null;
      }
      userIdRef.current = null;
    };
  }, [user?.id, refreshInProgressStories]); // Only depend on user.id, not the entire user object

  return (
    <RealtimeContext.Provider value={{ refreshInProgressStories, subscribeToStoryChanges }}>
      {children}
    </RealtimeContext.Provider>
  );
};
