
import { supabase } from '@/integrations/supabase/client';

export interface InProgressStory {
  id: string;
  title: string;
  status: string;
  created_at: string;
  story_pages: any[];
  [key: string]: any;
}

export const inProgressStoriesService = {
  async fetchInProgressStories(userId: string): Promise<InProgressStory[]> {
    console.log('Fetching in-progress stories...');
    const { data, error } = await supabase
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
      .eq('user_id', userId)
      .in('status', ['processing', 'completed', 'failed']) // Include completed stories until saved
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    console.log('Fetched in-progress stories:', data?.length || 0);
    return data || [];
  },

  async cancelStory(storyId: string): Promise<void> {
    const { error } = await supabase
      .from('stories')
      .update({ 
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        description: 'Story processing was cancelled by user'
      })
      .eq('id', storyId);

    if (error) throw error;
  },

  async cancelAllProcessingStories(storyIds: string[]): Promise<void> {
    const { error } = await supabase
      .from('stories')
      .update({ 
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        description: 'Story processing was cancelled by user (bulk cancel)'
      })
      .in('id', storyIds);

    if (error) throw error;
  },

  async regeneratePage(pageId: string, storyId: string, artStyle: string): Promise<any> {
    console.log('🔄 Calling regenerate-page function with:', { pageId, storyId, artStyle });
    
    const { data, error } = await supabase.functions.invoke('regenerate-page', {
      body: { pageId, storyId, artStyle }
    });

    if (error) {
      console.error('❌ Regeneration service error:', error);
      throw error;
    }
    
    console.log('✅ Regeneration service response:', data);
    return data;
  },

  async deleteStory(storyId: string): Promise<void> {
    const { error } = await supabase
      .from('stories')
      .delete()
      .eq('id', storyId);

    if (error) throw error;
  },

  async saveStoryToLibrary(storyId: string): Promise<void> {
    const { error } = await supabase
      .from('stories')
      .update({ 
        status: 'saved',
        updated_at: new Date().toISOString()
      })
      .eq('id', storyId);

    if (error) throw error;
  },

  // New method to fetch a single story with updated data
  async fetchStoryById(storyId: string): Promise<InProgressStory | null> {
    console.log('Fetching single story:', storyId);
    const { data, error } = await supabase
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
      .single();

    if (error) {
      console.error('Error fetching story:', error);
      throw error;
    }
    
    return data;
  }
};
