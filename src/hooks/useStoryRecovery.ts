
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const useStoryRecovery = () => {
  const [isRecovering, setIsRecovering] = useState(false);
  const { user } = useAuth();

  // Auto-recovery check every 30 seconds for processing stories
  useEffect(() => {
    if (!user) return;

    const checkAndRecover = async () => {
      try {
        const { data: processingStories } = await supabase
          .from('stories')
          .select(`
            id,
            title,
            created_at,
            story_pages (id, transformation_status)
          `)
          .eq('user_id', user.id)
          .eq('status', 'processing');

        for (const story of processingStories || []) {
          // Check if story has been processing for more than 10 minutes
          const createdAt = new Date(story.created_at);
          const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
          
          if (createdAt < tenMinutesAgo) {
            // Check if all pages are completed
            const allPagesCompleted = story.story_pages.every(
              page => page.transformation_status === 'completed'
            );

            if (allPagesCompleted && story.story_pages.length > 0) {
              // Auto-recover completed story
              await supabase
                .from('stories')
                .update({ status: 'completed' })
                .eq('id', story.id);

              console.log(`Auto-recovered story: ${story.title}`);
            }
          }
        }
      } catch (error) {
        console.error('Auto-recovery check failed:', error);
      }
    };

    // Initial check
    checkAndRecover();

    // Set up interval for periodic checks
    const interval = setInterval(checkAndRecover, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [user]);

  const recoverProcessingStories = async () => {
    if (!user) return;

    setIsRecovering(true);
    try {
      // Find stories stuck in processing state
      const { data: processingStories, error } = await supabase
        .from('stories')
        .select(`
          id,
          title,
          story_pages (id, transformation_status)
        `)
        .eq('user_id', user.id)
        .eq('status', 'processing');

      if (error) throw error;

      let recoveredCount = 0;

      for (const story of processingStories || []) {
        // Check if all pages are completed
        const allPagesCompleted = story.story_pages.every(
          page => page.transformation_status === 'completed'
        );

        if (allPagesCompleted && story.story_pages.length > 0) {
          // Update story to completed
          await supabase
            .from('stories')
            .update({ status: 'completed' })
            .eq('id', story.id);

          recoveredCount++;
          console.log(`Recovered story: ${story.title}`);
        }
      }

      toast({
        title: "Recovery Complete",
        description: recoveredCount > 0 
          ? `Recovered ${recoveredCount} completed ${recoveredCount === 1 ? 'story' : 'stories'}.`
          : "No stories needed recovery. All stories are up to date."
      });

    } catch (error) {
      console.error('Recovery error:', error);
      toast({
        title: "Recovery Error",
        description: "Failed to recover stories. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsRecovering(false);
    }
  };

  return {
    recoverProcessingStories,
    isRecovering
  };
};
