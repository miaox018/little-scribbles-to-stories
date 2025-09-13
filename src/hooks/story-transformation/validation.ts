
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const validateStoryCreation = async (userId: string) => {
  console.log('Story creation validation - with credit system, users can always create stories');
  // With credit system, story creation is always allowed
  // Credit validation happens at page upload time
  return true;
};

export const validatePageUpload = async (userId: string, storyId: string, imageCount: number) => {
  console.log(`Checking if user has ${imageCount} credits for page upload...`);
  
  const { data: hasEnoughCredits } = await supabase.rpc('check_user_credits', {
    user_id_param: userId,
    credits_needed: imageCount
  });

  if (!hasEnoughCredits) {
    throw new Error(`You need ${imageCount} credits to upload ${imageCount} pages. Purchase more credits to continue.`);
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
