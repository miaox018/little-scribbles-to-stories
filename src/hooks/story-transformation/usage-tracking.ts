
import { supabase } from '@/integrations/supabase/client';

export const trackStoryCreation = async (userId: string, imageCount: number) => {
  console.log('Tracking story creation...');
  
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
  
  const { data: existingUsage } = await supabase
    .from('monthly_usage')
    .select('stories_created')
    .eq('user_id', userId)
    .eq('month_year', currentMonth)
    .single();

  if (existingUsage) {
    await supabase
      .from('monthly_usage')
      .update({
        stories_created: existingUsage.stories_created + 1,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('month_year', currentMonth);
  } else {
    await supabase
      .from('monthly_usage')
      .insert({
        user_id: userId,
        month_year: currentMonth,
        stories_created: 1,
        total_pages_uploaded: imageCount,
        total_pages_regenerated: 0
      });
  }
};

export const trackPageUploads = async (userId: string, storyId: string, imageCount: number) => {
  const currentMonth = new Date().toISOString().slice(0, 7);
  
  await supabase
    .from('usage_tracking')
    .upsert({
      user_id: userId,
      story_id: storyId,
      month_year: currentMonth,
      pages_uploaded: imageCount,
      pages_regenerated: 0
    });
};
