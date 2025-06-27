
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const useUsageTracking = () => {
  const { user } = useAuth();

  const trackStoryCreation = async (storyId: string) => {
    if (!user) return;

    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format

    try {
      // Update or insert monthly usage manually
      const { data: existingUsage } = await supabase
        .from('monthly_usage')
        .select('stories_created')
        .eq('user_id', user.id)
        .eq('month_year', currentMonth)
        .single();

      if (existingUsage) {
        await supabase
          .from('monthly_usage')
          .update({
            stories_created: existingUsage.stories_created + 1,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id)
          .eq('month_year', currentMonth);
      } else {
        await supabase
          .from('monthly_usage')
          .insert({
            user_id: user.id,
            month_year: currentMonth,
            stories_created: 1,
            total_pages_uploaded: 0,
            total_pages_regenerated: 0
          });
      }

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
      const { data: existingTracking } = await supabase
        .from('usage_tracking')
        .select('pages_uploaded')
        .eq('user_id', user.id)
        .eq('story_id', storyId)
        .single();

      if (existingTracking) {
        await supabase
          .from('usage_tracking')
          .update({
            pages_uploaded: existingTracking.pages_uploaded + pageCount,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id)
          .eq('story_id', storyId);
      } else {
        await supabase
          .from('usage_tracking')
          .upsert({
            user_id: user.id,
            story_id: storyId,
            month_year: currentMonth,
            pages_uploaded: pageCount,
            pages_regenerated: 0
          });
      }

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
      const { data: existingTracking } = await supabase
        .from('usage_tracking')
        .select('pages_regenerated')
        .eq('user_id', user.id)
        .eq('story_id', storyId)
        .single();

      if (existingTracking) {
        await supabase
          .from('usage_tracking')
          .update({
            pages_regenerated: existingTracking.pages_regenerated + 1,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id)
          .eq('story_id', storyId);
      }

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
