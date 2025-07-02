
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const useStoryRecovery = () => {
  const [isRecovering, setIsRecovering] = useState(false);
  const { user } = useAuth();

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
          total_pages,
          created_at,
          story_pages (id, transformation_status)
        `)
        .eq('user_id', user.id)
        .eq('status', 'processing')
        .order('created_at', { ascending: false });

      if (error) throw error;

      let recoveredCount = 0;
      let stuckCount = 0;

      for (const story of processingStories || []) {
        // Check if all pages are completed
        const allPagesCompleted = story.story_pages.length > 0 && story.story_pages.every(
          page => page.transformation_status === 'completed'
        );

        // Check if story has been processing for more than 10 minutes without progress
        const createdAt = new Date(story.created_at);
        const now = new Date();
        const minutesElapsed = (now.getTime() - createdAt.getTime()) / (1000 * 60);
        const isStuck = minutesElapsed > 10 && story.story_pages.length === 0;

        if (allPagesCompleted) {
          // Update story to completed
          await supabase
            .from('stories')
            .update({ status: 'completed' })
            .eq('id', story.id);

          console.log(`Recovered completed story: ${story.title}`);
          recoveredCount++;
        } else if (isStuck) {
          // Mark stuck stories as failed
          await supabase
            .from('stories')
            .update({ 
              status: 'failed',
              description: 'Processing timeout - story creation may have failed'
            })
            .eq('id', story.id);

          console.log(`Marked stuck story as failed: ${story.title}`);
          stuckCount++;
        }
      }

      if (recoveredCount > 0 || stuckCount > 0) {
        toast({
          title: "Recovery Complete",
          description: `Recovered ${recoveredCount} completed stories and cleaned up ${stuckCount} stuck stories.`
        });
      } else {
        toast({
          title: "Recovery Complete",
          description: "No stories needed recovery."
        });
      }

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

  const checkForUnfinishedStories = async () => {
    if (!user) return;

    try {
      const { data: unfinishedStories, error } = await supabase
        .from('stories')
        .select('id, title, created_at')
        .eq('user_id', user.id)
        .eq('status', 'processing')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;

      if (unfinishedStories && unfinishedStories.length > 0) {
        const story = unfinishedStories[0];
        const createdAt = new Date(story.created_at);
        const now = new Date();
        const minutesElapsed = (now.getTime() - createdAt.getTime()) / (1000 * 60);

        if (minutesElapsed < 15) {
          toast({
            title: "Story Still Processing",
            description: `"${story.title}" is still being processed. Check "Stories In Progress" for updates.`,
            duration: 6000,
          });
        }
      }
    } catch (error) {
      console.error('Error checking unfinished stories:', error);
    }
  };

  return {
    recoverProcessingStories,
    checkForUnfinishedStories,
    isRecovering
  };
};
