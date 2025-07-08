import { useEffect } from 'react';

interface UsePeriodicRefreshProps {
  stories: any[];
  onRefresh: () => void;
  intervalMs?: number;
}

export const usePeriodicRefresh = ({ 
  stories, 
  onRefresh, 
  intervalMs = 15000 
}: UsePeriodicRefreshProps) => {
  useEffect(() => {
    const interval = setInterval(() => {
      const hasProcessingStories = stories.some(story => story.status === 'processing');
      if (hasProcessingStories) {
        console.log('Refreshing in-progress stories (periodic)...');
        onRefresh();
      }
    }, intervalMs);
    
    return () => clearInterval(interval);
  }, [stories, onRefresh, intervalMs]);
};