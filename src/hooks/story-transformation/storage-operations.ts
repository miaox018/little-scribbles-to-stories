
import { supabase } from '@/integrations/supabase/client';

// Phase 1 optimization: Simple image compression function
const compressImage = async (file: File): Promise<File> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Resize to max 1024px width while maintaining aspect ratio
      const maxWidth = 1024;
      const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
      
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;
      
      ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const compressedFile = new File([blob], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now()
          });
          resolve(compressedFile);
        } else {
          resolve(file); // Fallback to original if compression fails
        }
      }, 'image/jpeg', 0.8); // 80% quality
    };
    
    img.onerror = () => resolve(file); // Fallback to original if loading fails
    img.src = URL.createObjectURL(file);
  });
};

export const uploadImagesToStorage = async (images: File[], storyId: string, userId: string) => {
  console.log('Phase 1 optimization: Uploading images to Supabase Storage with optimizations...');
  
  const uploadPromises = images.map(async (file, index) => {
    // Phase 1 optimization: Compress large files before upload
    let fileToUpload = file;
    if (file.size > 5 * 1024 * 1024) { // If larger than 5MB
      console.log(`Compressing large image ${index + 1} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
      fileToUpload = await compressImage(file);
    }
    
    const fileName = `${userId}/temp/${storyId}/page_${index + 1}_${Date.now()}.${fileToUpload.name.split('.').pop()}`;
    
    console.log(`Uploading image ${index + 1} to: ${fileName}`);
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('story-images')
      .upload(fileName, fileToUpload, {
        contentType: fileToUpload.type,
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
