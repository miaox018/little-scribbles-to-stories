
import { supabase } from '@/integrations/supabase/client';

// Image normalization utilities
const MAX_DIMENSION = 1024;
const TARGET_ASPECT_RATIO = 1024 / 1536; // Portrait book aspect
const TARGET_WIDTH = 1024;
const TARGET_HEIGHT = 1536;

interface NormalizedImageData {
  originalUrl: string;
  normalizedUrl: string;
  thumbnailUrl: string;
  pageNumber: number;
}

// Normalize image to target canvas size
const normalizeImageToCanvas = async (file: File): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Set canvas to target size
      canvas.width = TARGET_WIDTH;
      canvas.height = TARGET_HEIGHT;
      
      // Fill with white background
      ctx!.fillStyle = 'white';
      ctx!.fillRect(0, 0, TARGET_WIDTH, TARGET_HEIGHT);
      
      // Calculate scaling to fit image while preserving aspect ratio
      const imgAspect = img.width / img.height;
      const targetAspect = TARGET_WIDTH / TARGET_HEIGHT;
      
      let drawWidth, drawHeight, drawX, drawY;
      
      if (imgAspect > targetAspect) {
        // Image is wider than target - fit to width
        drawWidth = TARGET_WIDTH;
        drawHeight = TARGET_WIDTH / imgAspect;
        drawX = 0;
        drawY = (TARGET_HEIGHT - drawHeight) / 2;
      } else {
        // Image is taller than target - fit to height
        drawHeight = TARGET_HEIGHT;
        drawWidth = TARGET_HEIGHT * imgAspect;
        drawX = (TARGET_WIDTH - drawWidth) / 2;
        drawY = 0;
      }
      
      // Draw the image centered on the canvas
      ctx!.drawImage(img, drawX, drawY, drawWidth, drawHeight);
      
      // Convert to blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create normalized image blob'));
          }
        },
        'image/png',
        1.0
      );
    };
    
    img.onerror = () => reject(new Error('Failed to load image for normalization'));
    img.src = URL.createObjectURL(file);
  });
};

// Create thumbnail (WebP format for smaller size)
const createThumbnail = async (file: File, maxSize: number = 256): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Calculate thumbnail dimensions
      const scale = Math.min(maxSize / img.width, maxSize / img.height);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      
      // Draw scaled image
      ctx!.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      // Convert to WebP blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create thumbnail blob'));
          }
        },
        'image/webp',
        0.8
      );
    };
    
    img.onerror = () => reject(new Error('Failed to load image for thumbnail'));
    img.src = URL.createObjectURL(file);
  });
};

export const uploadImagesToStorage = async (images: File[], storyId: string, userId: string): Promise<NormalizedImageData[]> => {
  console.log('Processing and uploading images with normalization...');
  
  const uploadPromises = images.map(async (file, index) => {
    const pageNumber = index + 1;
    const timestamp = Date.now();
    
    // Generate file paths
    const originalPath = `${userId}/originals/${storyId}/page_${pageNumber}_${timestamp}.${file.name.split('.').pop()}`;
    const normalizedPath = `${userId}/normalized/${storyId}/page_${pageNumber}_${timestamp}.png`;
    const thumbnailPath = `${userId}/thumbnails/${storyId}/page_${pageNumber}_${timestamp}.webp`;
    
    console.log(`Processing image ${pageNumber}...`);
    
    try {
      // Create normalized and thumbnail versions
      const [normalizedBlob, thumbnailBlob] = await Promise.all([
        normalizeImageToCanvas(file),
        createThumbnail(file)
      ]);
      
      // Upload all three versions
      const [originalUpload, normalizedUpload, thumbnailUpload] = await Promise.all([
        supabase.storage.from('story-images').upload(originalPath, file, {
          contentType: file.type,
          upsert: false
        }),
        supabase.storage.from('story-images').upload(normalizedPath, normalizedBlob, {
          contentType: 'image/png',
          upsert: false
        }),
        supabase.storage.from('story-images').upload(thumbnailPath, thumbnailBlob, {
          contentType: 'image/webp',
          upsert: false
        })
      ]);
      
      // Check for upload errors
      if (originalUpload.error) throw originalUpload.error;
      if (normalizedUpload.error) throw normalizedUpload.error;
      if (thumbnailUpload.error) throw thumbnailUpload.error;
      
      // Get public URLs
      const originalUrl = supabase.storage.from('story-images').getPublicUrl(originalPath).data.publicUrl;
      const normalizedUrl = supabase.storage.from('story-images').getPublicUrl(normalizedPath).data.publicUrl;
      const thumbnailUrl = supabase.storage.from('story-images').getPublicUrl(thumbnailPath).data.publicUrl;
      
      console.log(`Image ${pageNumber} processed and uploaded successfully`);
      
      return {
        originalUrl,
        normalizedUrl,
        thumbnailUrl,
        pageNumber
      };
      
    } catch (error) {
      console.error(`Error processing image ${pageNumber}:`, error);
      throw error;
    }
  });

  const imageData = await Promise.all(uploadPromises);
  console.log('All images processed and uploaded successfully:', imageData.length);
  
  return imageData;
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
