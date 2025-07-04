
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

export interface StoryData {
  id: string;
  title: string;
  art_style: string | null;
  story_pages: StoryPage[];
}

export interface StoryPage {
  id: string;
  page_number: number;
  original_image_url: string | null;
  generated_image_url: string | null;
  transformation_status: string | null;
}

export async function fetchStoryData(storyId: string, userId: string): Promise<{ story: StoryData | null; error: string | null }> {
  console.log('🔍 Fetching story data...');
  
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  if (!supabaseUrl || !supabaseServiceKey) {
    return { story: null, error: 'Database configuration error' };
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Verify story ownership and fetch story data
  const { data: story, error: storyError } = await supabase
    .from('stories')
    .select(`
      *,
      story_pages (
        id,
        page_number,
        original_image_url,
        generated_image_url,
        transformation_status
      )
    `)
    .eq('id', storyId)
    .eq('user_id', userId)
    .single();

  if (storyError) {
    console.error('❌ Story query error:', storyError);
    return { story: null, error: 'Story not found or access denied' };
  }

  if (!story) {
    console.error('❌ Story not found for user:', userId, 'story:', storyId);
    return { story: null, error: 'Story not found' };
  }

  console.log('✅ Story found:', story.title, 'with', story.story_pages?.length || 0, 'pages');
  return { story, error: null };
}

export function sortStoryPages(pages: StoryPage[]): StoryPage[] {
  return pages?.sort((a, b) => a.page_number - b.page_number) || [];
}
