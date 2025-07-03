
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
          story_pages (id, transformation_status)
        `)
        .eq('user_id', user.id)
        .eq('status', 'processing');

      if (error) throw error;

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

          console.log(`Recovered story: ${story.title}`);
        }
      }

      toast({
        title: "Recovery Complete",
        description: "Checked and recovered any completed stories that were stuck in processing."
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
