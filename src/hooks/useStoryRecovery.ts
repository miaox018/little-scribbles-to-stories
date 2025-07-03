
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
      console.log('Starting story recovery process...');
      
      // Find stories stuck in processing state
      const { data: processingStories, error } = await supabase
        .from('stories')
        .select(`
          id,
          title,
          created_at,
          description,
          story_pages (id, transformation_status)
        `)
        .eq('user_id', user.id)
        .eq('status', 'processing');

      if (error) throw error;

      console.log(`Found ${processingStories?.length || 0} processing stories`);

      let recoveredCount = 0;
      let stuckCount = 0;

      for (const story of processingStories || []) {
        const createdAt = new Date(story.created_at);
        const now = new Date();
        const ageInMinutes = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60));
        
        console.log(`Story "${story.title}" (${story.id}): Age ${ageInMinutes} minutes, Pages: ${story.story_pages.length}`);
        
        // Check if story is stuck (processing for more than 15 minutes)
        if (ageInMinutes > 15) {
          console.log(`Story "${story.title}" appears to be stuck (${ageInMinutes} minutes old)`);
          
          // Check if all pages are completed
          const allPagesCompleted = story.story_pages.length > 0 && story.story_pages.every(
            page => page.transformation_status === 'completed'
          );

          if (allPagesCompleted) {
            // Update story to completed
            const { error: updateError } = await supabase
              .from('stories')
              .update({ 
                status: 'completed',
                description: `Story completed with ${story.story_pages.length} pages (recovered from stuck state)`
              })
              .eq('id', story.id);

            if (!updateError) {
              console.log(`Recovered completed story: ${story.title}`);
              recoveredCount++;
            }
          } else {
            // Check if some pages are completed
            const completedPages = story.story_pages.filter(page => page.transformation_status === 'completed');
            const failedPages = story.story_pages.filter(page => page.transformation_status === 'failed');
            
            if (completedPages.length > 0) {
              // Mark as partial
              const { error: updateError } = await supabase
                .from('stories')
                .update({ 
                  status: 'partial',
                  description: `Story partially completed: ${completedPages.length} successful, ${failedPages.length} failed pages (recovered from stuck state)`
                })
                .eq('id', story.id);

              if (!updateError) {
                console.log(`Recovered partial story: ${story.title}`);
                recoveredCount++;
              }
            } else {
              // Mark as failed if no progress after 15+ minutes
              const { error: updateError } = await supabase
                .from('stories')
                .update({ 
                  status: 'failed',
                  description: `Story processing failed: No progress after ${ageInMinutes} minutes (recovered from stuck state)`
                })
                .eq('id', story.id);

              if (!updateError) {
                console.log(`Marked stuck story as failed: ${story.title}`);
                stuckCount++;
              }
            }
          }
        } else {
          // Story is still within normal processing time
          console.log(`Story "${story.title}" is still within normal processing time (${ageInMinutes} minutes)`);
        }
      }

      const message = recoveredCount > 0 || stuckCount > 0 
        ? `Recovery complete: ${recoveredCount} stories recovered, ${stuckCount} stuck stories marked as failed`
        : 'All processing stories appear to be running normally';

      toast({
        title: "Recovery Complete",
        description: message
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
