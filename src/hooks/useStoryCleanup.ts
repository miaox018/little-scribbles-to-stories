
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useStoryCleanup = () => {
  const { user } = useAuth();

  const cleanupStuckStories = useCallback(async () => {
    if (!user) return;

    console.log('Cleaning up stuck stories...');
    
    try {
      // Find stories that have been processing for more than 10 minutes
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      
      const { data: stuckStories, error } = await supabase
        .from('stories')
        .select('id, title, updated_at')
        .eq('user_id', user.id)
        .eq('status', 'processing')
        .lt('updated_at', tenMinutesAgo);

      if (error) {
        console.error('Error finding stuck stories:', error);
        return;
      }

      if (stuckStories && stuckStories.length > 0) {
        console.log(`Found ${stuckStories.length} stuck stories, marking as failed`);
        
        const { error: updateError } = await supabase
          .from('stories')
          .update({ 
            status: 'failed',
            description: 'Story processing timed out and was automatically cleaned up.',
            updated_at: new Date().toISOString()
          })
          .in('id', stuckStories.map(s => s.id));

        if (updateError) {
          console.error('Error updating stuck stories:', updateError);
        } else {
          console.log('Successfully cleaned up stuck stories');
        }
      }
    } catch (error) {
      console.error('Error during story cleanup:', error);
    }
  }, [user]);

  return { cleanupStuckStories };
};
