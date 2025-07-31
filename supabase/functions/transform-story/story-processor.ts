
import { editImageWithGPT } from './openai-api.ts';
import { uploadImageToSupabase, uploadOriginalImageToSupabase } from './storage-utils.ts';
import { buildTransformationPrompt } from './prompt-builder.ts';
import type { ProcessStoryPageParams } from './types.ts';

// Function to safely convert ArrayBuffer to base64 using chunked processing
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const CHUNK_SIZE = 32768; // 32KB chunks to avoid stack overflow
  let binary = '';
  
  console.log(`Converting ArrayBuffer to base64: ${bytes.length} bytes`);
  
  for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
    const chunk = bytes.subarray(i, i + CHUNK_SIZE);
    // Use Array.from to convert chunk to regular array, then apply String.fromCharCode
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  
  return btoa(binary);
}

// Function to normalize image for OpenAI API requirements
async function normalizeImageForOpenAI(imageUrl: string): Promise<string> {
  try {
    console.log(`[IMAGE-PREPROCESSING] Starting normalization for: ${imageUrl}`);
    
    // Fetch the original image
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const originalSize = arrayBuffer.byteLength;
    console.log(`[IMAGE-PREPROCESSING] Original image size: ${(originalSize / 1024 / 1024).toFixed(2)}MB`);
    
    // Create canvas for image processing
    const canvas = new OffscreenCanvas(1, 1);
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }
    
    // Create image from array buffer
    const blob = new Blob([arrayBuffer]);
    const imageBitmap = await createImageBitmap(blob);
    
    // Calculate new dimensions (max 1024px on longest side)
    const maxDimension = 1024;
    let { width, height } = imageBitmap;
    
    if (width > maxDimension || height > maxDimension) {
      const aspectRatio = width / height;
      if (width > height) {
        width = maxDimension;
        height = Math.round(maxDimension / aspectRatio);
      } else {
        height = maxDimension;
        width = Math.round(maxDimension * aspectRatio);
      }
      console.log(`[IMAGE-PREPROCESSING] Resizing to: ${width}x${height}`);
    } else {
      console.log(`[IMAGE-PREPROCESSING] No resizing needed: ${width}x${height}`);
    }
    
    // Set canvas size and draw resized image
    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(imageBitmap, 0, 0, width, height);
    
    // Convert to PNG with compression
    const normalizedBlob = await canvas.convertToBlob({
      type: 'image/png',
      quality: 0.9
    });
    
    // Check if we need further compression
    let finalBlob = normalizedBlob;
    if (normalizedBlob.size > 4 * 1024 * 1024) { // 4MB limit
      console.log(`[IMAGE-PREPROCESSING] Image still too large (${(normalizedBlob.size / 1024 / 1024).toFixed(2)}MB), applying compression`);
      finalBlob = await canvas.convertToBlob({
        type: 'image/png',
        quality: 0.7
      });
    }
    
    console.log(`[IMAGE-PREPROCESSING] Final size: ${(finalBlob.size / 1024 / 1024).toFixed(2)}MB`);
    
    // Convert to data URL
    const reader = new FileReader();
    return new Promise((resolve, reject) => {
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(finalBlob);
    });
    
  } catch (error) {
    console.error(`[IMAGE-PREPROCESSING] Error normalizing image:`, error);
    // Fallback to original fetch method if preprocessing fails
    console.log(`[IMAGE-PREPROCESSING] Falling back to original method`);
    return await fetchImageAsDataUrl(imageUrl);
  }
}

// Function to fetch image from URL and convert to base64
async function fetchImageAsDataUrl(imageUrl: string): Promise<string> {
  try {
    console.log(`Fetching image from URL: ${imageUrl}`);
    const response = await fetch(imageUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    
    console.log(`Image fetched successfully: ${arrayBuffer.byteLength} bytes, type: ${contentType}`);
    
    // Log warning for large images
    if (arrayBuffer.byteLength > 10 * 1024 * 1024) { // 10MB
      console.warn(`Large image detected: ${(arrayBuffer.byteLength / 1024 / 1024).toFixed(2)}MB`);
    }
    
    // Use chunked processing to avoid stack overflow
    const base64 = arrayBufferToBase64(arrayBuffer);
    const dataUrl = `data:${contentType};base64,${base64}`;
    
    console.log(`Successfully converted image to data URL (length: ${dataUrl.length})`);
    
    return dataUrl;
  } catch (error) {
    console.error(`Error fetching image from URL: ${imageUrl}`, error);
    throw new Error(`Failed to fetch image: ${error.message}`);
  }
}

// Function to detect if content contains Chinese characters
function containsChinese(text: string): boolean {
  return /[\u4e00-\u9fff]/.test(text);
}

export async function processStoryPage({
  imageData, 
  pageNumber, 
  storyId, 
  userId,
  stylePrompt,
  characterDescriptions,
  artStyleGuidelines,
  supabase
}: ProcessStoryPageParams) {
  // Check if story was cancelled
  const { data: story } = await supabase
    .from('stories')
    .select('status, title')
    .eq('id', storyId)
    .single();

  if (story?.status === 'cancelled') {
    throw new Error('Story transformation was cancelled');
  }

  try {
    console.log(`[GPT-Image-1 Edit] Processing page ${pageNumber} with image-to-image transformation`);
    
    // Normalize the image for OpenAI API requirements (A. Pre-flight image normalization)
    const normalizedImageDataUrl = await normalizeImageForOpenAI(imageData.storageUrl);
    
    // Upload original image to permanent storage
    const originalImageUrl = await uploadOriginalImageToSupabase(normalizedImageDataUrl, storyId, pageNumber, userId, supabase);

    // Build transformation prompt for image editing with language detection (D. Language robustness)
    const hasChineseContent = story?.title ? containsChinese(story.title) : false;
    const transformationPrompt = buildTransformationPrompt(
      pageNumber, 
      stylePrompt, 
      characterDescriptions, 
      artStyleGuidelines,
      hasChineseContent
    );
    console.log(`[GPT-Image-1 Edit] Built transformation prompt for page ${pageNumber}`);

    // Edit the image directly with GPT-Image-1 using the normalized drawing as input
    const editedImageUrl = await editImageWithGPT(normalizedImageDataUrl, transformationPrompt);
    console.log(`[GPT-Image-1 Edit] Edited image for page ${pageNumber}`);

    // Upload edited image to Supabase Storage
    const finalImageUrl = await uploadImageToSupabase(editedImageUrl, storyId, pageNumber, userId, supabase);

    // Create story page record with transformation prompt as enhanced_prompt
    await supabase
      .from('story_pages')
      .insert({
        story_id: storyId,
        page_number: pageNumber,
        original_image_url: originalImageUrl,
        generated_image_url: finalImageUrl,
        enhanced_prompt: transformationPrompt, // Store the transformation prompt
        transformation_status: 'completed',
        error_message: null // Clear any previous error
      });

    console.log(`[GPT-Image-1 Edit] Successfully completed page ${pageNumber}`);
    
    return { 
      analysisText: transformationPrompt, // Return transformation prompt as analysis text
      generatedImageUrl: finalImageUrl, 
      originalImageUrl 
    };
  } catch (error) {
    console.error(`[GPT-Image-1 Edit] Error processing page ${pageNumber}:`, error);
    
    // Enhanced error logging (E. Better error telemetry)
    const errorMessage = error.message || 'Unknown error';
    const errorDetails = {
      error: errorMessage,
      timestamp: new Date().toISOString(),
      pageNumber,
      storyId
    };
    
    console.error(`[GPT-Image-1 Edit] Detailed error info:`, errorDetails);
    
    // Still create a page record but mark as failed with detailed error info
    await supabase
      .from('story_pages')
      .insert({
        story_id: storyId,
        page_number: pageNumber,
        original_image_url: imageData.storageUrl || null,
        generated_image_url: null,
        enhanced_prompt: null,
        transformation_status: 'failed',
        error_message: JSON.stringify(errorDetails) // Store detailed error info
      });

    throw error;
  }
}
