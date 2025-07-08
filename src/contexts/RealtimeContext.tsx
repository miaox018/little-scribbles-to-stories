
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
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
  const [isSubscribed, setIsSubscribed] = useState(false);

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
    if (!user || isSubscribed) return;

    console.log('Setting up global real-time subscription for user:', user.id);
    
    const storyChannelName = `story-changes-${user.id}-${Date.now()}`;
    const pageChannelName = `story-page-changes-${user.id}-${Date.now()}`;

    let storyChannel: any = null;
    let pageChannel: any = null;

    try {
      // Subscribe to story changes
      storyChannel = supabase
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
      pageChannel = supabase
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
        setIsSubscribed(true);
      }).catch((error) => {
        console.error('Failed to subscribe to real-time channels:', error);
      });

    } catch (error) {
      console.error('Error setting up real-time subscriptions:', error);
    }

    return () => {
      console.log('Cleaning up global real-time subscriptions...');
      setIsSubscribed(false);
      
      if (storyChannel) {
        supabase.removeChannel(storyChannel);
      }
      if (pageChannel) {
        supabase.removeChannel(pageChannel);
      }
    };
  }, [user, isSubscribed, refreshInProgressStories]);

  return (
    <RealtimeContext.Provider value={{ refreshInProgressStories, subscribeToStoryChanges }}>
      {children}
    </RealtimeContext.Provider>
  );
};
