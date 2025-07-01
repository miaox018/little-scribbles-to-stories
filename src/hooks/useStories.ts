
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export const useStories = () => {
  const { user } = useAuth();

  const { data: stories, isLoading, error, refetch } = useQuery({
    queryKey: ['stories', user?.id],
    queryFn: async () => {
      if (!user) return [];

      console.log('Fetching stories for user:', user.id);

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
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching stories:', error);
        throw error;
      }
      
      console.log('Fetched stories:', data);
      return data || [];
    },
    enabled: !!user,
  });

  return {
    stories: stories || [],
    isLoading,
    error,
    refetch
  };
};
