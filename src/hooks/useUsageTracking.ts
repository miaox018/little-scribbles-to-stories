
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const useUsageTracking = () => {
  const { user } = useAuth();

  const trackStoryCreation = async (storyId: string) => {
    if (!user) return;

    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format

    try {
      // Update monthly usage
      await supabase.rpc('update_monthly_usage', {
        user_id_param: user.id,
        month_year_param: currentMonth,
        stories_increment: 1
      });

      // Initialize usage tracking for this story
      await supabase
        .from('usage_tracking')
        .upsert({
          user_id: user.id,
          story_id: storyId,
          month_year: currentMonth,
          pages_uploaded: 0,
          pages_regenerated: 0
        });
    } catch (error) {
      console.error('Error tracking story creation:', error);
    }
  };

  const trackPageUpload = async (storyId: string, pageCount: number = 1) => {
    if (!user) return;

    const currentMonth = new Date().toISOString().slice(0, 7);

    try {
      // Check if user can upload more pages
      const { data: canUpload } = await supabase.rpc('can_upload_pages', {
        user_id_param: user.id,
        story_id_param: storyId,
        additional_pages: pageCount
      });

      if (!canUpload) {
        toast({
          title: "Upload Limit Reached",
          description: "You've reached your page upload limit for this story. Upgrade to upload more pages.",
          variant: "destructive"
        });
        return false;
      }

      // Update usage tracking
      await supabase
        .from('usage_tracking')
        .upsert({
          user_id: user.id,
          story_id: storyId,
          month_year: currentMonth,
          pages_uploaded: pageCount,
          pages_regenerated: 0
        }, {
          onConflict: 'user_id,story_id',
          ignoreDuplicates: false
        });

      return true;
    } catch (error) {
      console.error('Error tracking page upload:', error);
      return false;
    }
  };

  const trackPageRegeneration = async (storyId: string) => {
    if (!user) return;

    try {
      // Check if user can regenerate more pages
      const { data: canRegenerate } = await supabase.rpc('can_regenerate_pages', {
        user_id_param: user.id,
        story_id_param: storyId,
        additional_regens: 1
      });

      if (!canRegenerate) {
        toast({
          title: "Regeneration Limit Reached",
          description: "You've reached your page regeneration limit for this story. Upgrade for more regenerations.",
          variant: "destructive"
        });
        return false;
      }

      // Update regeneration count
      const { error } = await supabase
        .from('usage_tracking')
        .update({
          pages_regenerated: supabase.sql`pages_regenerated + 1`
        })
        .eq('user_id', user.id)
        .eq('story_id', storyId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error tracking page regeneration:', error);
      return false;
    }
  };

  const checkCanCreateStory = async () => {
    if (!user) return false;

    try {
      const { data: canCreate } = await supabase.rpc('can_create_story', {
        user_id_param: user.id
      });

      return canCreate;
    } catch (error) {
      console.error('Error checking story creation limit:', error);
      return false;
    }
  };

  return {
    trackStoryCreation,
    trackPageUpload,
    trackPageRegeneration,
    checkCanCreateStory,
  };
};
