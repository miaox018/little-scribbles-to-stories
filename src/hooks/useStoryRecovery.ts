
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
    let recoveredCount = 0;
    let stuckCount = 0;
    
    try {
      console.log('Starting story recovery process...');
      
      // Find stories that might be stuck in processing
      const { data: processingStories, error } = await supabase
        .from('stories')
        .select(`
          id,
          title,
          status,
          total_pages,
          updated_at,
          created_at,
          story_pages (id, transformation_status)
        `)
        .eq('user_id', user.id)
        .eq('status', 'processing');

      if (error) throw error;
      console.log(`Found ${processingStories?.length || 0} processing stories to check`);

      for (const story of processingStories || []) {
        const completedPages = story.story_pages?.filter(page => page.transformation_status === 'completed').length || 0;
        const failedPages = story.story_pages?.filter(page => page.transformation_status === 'failed').length || 0;
        const totalPages = story.total_pages || story.story_pages?.length || 0;
        const lastUpdated = new Date(story.updated_at);
        const createdAt = new Date(story.created_at);
        const now = new Date();
        const minutesSinceUpdate = (now.getTime() - lastUpdated.getTime()) / (1000 * 60);
        const minutesSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60);

        console.log(`Story "${story.title}": ${completedPages}/${totalPages} pages completed, ${failedPages} failed`);
        console.log(`  - ${minutesSinceUpdate.toFixed(1)} minutes since update`);
        console.log(`  - ${minutesSinceCreation.toFixed(1)} minutes since creation`);

        // Check if story is actually completed
        if (completedPages > 0 && completedPages === totalPages) {
          console.log(`✅ Marking as completed: ${story.title}`);
          await supabase
            .from('stories')
            .update({ 
              status: 'completed',
              description: `Story completed with ${completedPages} pages`,
              updated_at: new Date().toISOString()
            })
            .eq('id', story.id);

          recoveredCount++;
        }
        // Check if story is partially completed
        else if (completedPages > 0 && (completedPages + failedPages) === totalPages) {
          console.log(`⚠️ Marking as partial: ${story.title}`);
          await supabase
            .from('stories')
            .update({ 
              status: 'partial',
              description: `Story partially completed: ${completedPages} successful, ${failedPages} failed pages`,
              updated_at: new Date().toISOString()
            })
            .eq('id', story.id);

          recoveredCount++;
        }
        // Check if story appears stuck (no updates for 10+ minutes OR no pages created after 15+ minutes)
        else if (minutesSinceUpdate > 10 || (story.story_pages?.length === 0 && minutesSinceCreation > 15)) {
          console.log(`❌ Marking as failed (stuck): ${story.title}`);
          const reason = story.story_pages?.length === 0 
            ? `No processing started after ${minutesSinceCreation.toFixed(0)} minutes`
            : `Processing stalled after ${minutesSinceUpdate.toFixed(0)} minutes`;
            
          await supabase
            .from('stories')
            .update({ 
              status: 'failed',
              description: `Processing failed: ${reason}`,
              updated_at: new Date().toISOString()
            })
            .eq('id', story.id);

          stuckCount++;
        }
      }

      // Show appropriate success message
      if (recoveredCount > 0 || stuckCount > 0) {
        const messages = [];
        if (recoveredCount > 0) messages.push(`${recoveredCount} stories recovered`);
        if (stuckCount > 0) messages.push(`${stuckCount} stuck stories marked as failed`);
        
        toast({
          title: "Recovery Complete",
          description: messages.join(' and ') + '. Check your stories for updates.',
        });
        
        console.log('Recovery completed:', { recoveredCount, stuckCount });
      } else {
        toast({
          title: "No Issues Found",
          description: "All processing stories appear to be running correctly.",
        });
        
        console.log('No stuck stories found');
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

  const resumeStoryProcessing = async (storyId: string) => {
    try {
      // Get story details
      const { data: story, error } = await supabase
        .from('stories')
        .select(`
          *,
          story_pages (id, page_number, transformation_status)
        `)
        .eq('id', storyId)
        .single();

      if (error) throw error;

      const completedPages = story.story_pages?.filter(p => p.transformation_status === 'completed').length || 0;
      const failedPages = story.story_pages?.filter(p => p.transformation_status === 'failed').length || 0;
      const totalPages = story.total_pages || 0;

      if (completedPages + failedPages < totalPages) {
        // Resume processing by calling the edge function
        const { error: resumeError } = await supabase.functions.invoke('resume-story-processing', {
          body: { storyId }
        });

        if (resumeError) throw resumeError;

        toast({
          title: "Processing Resumed",
          description: `Story processing has been resumed from page ${completedPages + 1}.`
        });
      } else {
        toast({
          title: "No Resume Needed",
          description: "This story has already been fully processed."
        });
      }
    } catch (error) {
      console.error('Resume error:', error);
      toast({
        title: "Resume Failed",
        description: "Failed to resume story processing. Please try again.",
        variant: "destructive"
      });
    }
  };

  return {
    recoverProcessingStories,
    resumeStoryProcessing,
    isRecovering
  };
};
