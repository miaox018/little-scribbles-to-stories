
import { supabase } from '@/integrations/supabase/client';

export const uploadImagesToStorage = async (images: File[], storyId: string, userId: string) => {
  console.log('Uploading images to Supabase Storage...');
  
  const uploadPromises = images.map(async (file, index) => {
    const fileName = `${userId}/temp/${storyId}/page_${index + 1}_${Date.now()}.${file.name.split('.').pop()}`;
    
    console.log(`Uploading image ${index + 1} to: ${fileName}`);
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('story-images')
      .upload(fileName, file, {
        contentType: file.type,
        upsert: false
      });

    if (uploadError) {
      console.error(`Upload error for image ${index + 1}:`, uploadError);
      throw uploadError;
    }

    const { data: urlData } = supabase.storage
      .from('story-images')
      .getPublicUrl(fileName);

    return {
      storageUrl: urlData.publicUrl,
      pageNumber: index + 1
    };
  });

  const imageUrls = await Promise.all(uploadPromises);
  console.log('All images uploaded successfully:', imageUrls.length);
  
  return imageUrls;
};

export const cleanupTempImages = async (storyId: string, userId: string) => {
  console.log('Cleaning up temporary images...');
  
  try {
    const { data: files, error } = await supabase.storage
      .from('story-images')
      .list(`${userId}/temp/${storyId}`);

    if (error || !files || files.length === 0) {
      console.log('No temp files to clean up');
      return;
    }

    const filePaths = files.map(file => `${userId}/temp/${storyId}/${file.name}`);
    
    const { error: deleteError } = await supabase.storage
      .from('story-images')
      .remove(filePaths);

    if (deleteError) {
      console.error('Error cleaning up temp files:', deleteError);
    } else {
      console.log('Temp files cleaned up successfully');
    }
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
};
