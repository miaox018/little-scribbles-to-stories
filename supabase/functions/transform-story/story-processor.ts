

import { editImageWithGPT } from './openai-api.ts';
import { uploadImageToSupabase, uploadOriginalImageToSupabase } from './storage-utils.ts';
import { buildPrompt } from './prompt-builder.ts';
import { optimizeImageForGPT } from './image-optimizer.ts';
import { PerformanceTracker } from './performance-tracker.ts';
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
    .select('status')
    .eq('id', storyId)
    .single();

  if (story?.status === 'cancelled') {
    throw new Error('Story transformation was cancelled');
  }

  try {
    // Phase 1 optimization: Track processing performance
    const perf = new PerformanceTracker();
    console.log(`[GPT-Image-1 Edit] Processing page ${pageNumber} with Phase 1 optimizations`);
    
    // Fetch the original image from storage URL and convert to data URL for processing
    const originalImageDataUrl = await fetchImageAsDataUrl(imageData.storageUrl);
    perf.checkpoint('image_fetch');
    
    // Phase 1 optimization: Optimize image for faster GPT processing
    const optimizedImageDataUrl = await optimizeImageForGPT(originalImageDataUrl);
    perf.checkpoint('image_optimization');
    
    // Upload original image to permanent storage
    const originalImageUrl = await uploadOriginalImageToSupabase(originalImageDataUrl, storyId, pageNumber, userId, supabase);
    perf.checkpoint('original_upload');

    // Build optimized transformation prompt for image editing
    const transformationPrompt = buildPrompt(pageNumber, stylePrompt, characterDescriptions, artStyleGuidelines);
    console.log(`[GPT-Image-1 Edit] Built optimized transformation prompt for page ${pageNumber}`);
    perf.checkpoint('prompt_build');

    // Edit the image directly with GPT-Image-1 using the optimized image as input
    const editedImageUrl = await editImageWithGPT(optimizedImageDataUrl, transformationPrompt);
    console.log(`[GPT-Image-1 Edit] Edited image for page ${pageNumber}`);
    perf.checkpoint('gpt_edit');

    // Upload edited image to Supabase Storage
    const finalImageUrl = await uploadImageToSupabase(editedImageUrl, storyId, pageNumber, userId, supabase);
    perf.checkpoint('final_upload');

    // Create story page record with transformation prompt as enhanced_prompt
    await supabase
      .from('story_pages')
      .insert({
        story_id: storyId,
        page_number: pageNumber,
        original_image_url: originalImageUrl,
        generated_image_url: finalImageUrl,
        enhanced_prompt: transformationPrompt, // Store the transformation prompt
        transformation_status: 'completed'
      });

    perf.checkpoint('db_insert');
    perf.logSummary();
    console.log(`[GPT-Image-1 Edit] Successfully completed page ${pageNumber} with Phase 1 optimizations`);
    
    return { 
      analysisText: transformationPrompt, // Return transformation prompt as analysis text
      generatedImageUrl: finalImageUrl, 
      originalImageUrl 
    };
  } catch (error) {
    console.error(`[GPT-Image-1 Edit] Error processing page ${pageNumber}:`, error);
    
    // Still create a page record but mark as failed
    await supabase
      .from('story_pages')
      .insert({
        story_id: storyId,
        page_number: pageNumber,
        original_image_url: imageData.storageUrl || null,
        generated_image_url: null,
        enhanced_prompt: null,
        transformation_status: 'failed'
      });

    throw error;
  }
}

