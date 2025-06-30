
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const validateStoryCreation = async (userId: string) => {
  console.log('Checking if user can create story...');
  
  const { data: canCreate } = await supabase.rpc('can_create_story', {
    user_id_param: userId
  });

  console.log('Can create story:', canCreate);
  
  if (!canCreate) {
    throw new Error('Story limit reached. Please upgrade your plan.');
  }
};

export const validatePageUpload = async (userId: string, storyId: string, imageCount: number) => {
  console.log('Checking page upload limits...');
  
  const { data: canUpload } = await supabase.rpc('can_upload_pages', {
    user_id_param: userId,
    story_id_param: storyId,
    additional_pages: imageCount
  });

  if (!canUpload) {
    throw new Error('Page upload limit exceeded. Please upgrade your plan.');
  }
};

export const validateUserAuthentication = (user: any) => {
  if (!user) {
    toast({
      title: "Authentication Required",
      description: "Please sign in to transform your story.",
      variant: "destructive"
    });
    throw new Error('User not authenticated');
  }
};
