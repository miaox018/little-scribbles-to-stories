import { editImageWithGPT } from './openai-api.ts';
import { uploadImageToSupabase, uploadOriginalImageToSupabase } from './storage-utils.ts';
import { buildPrompt } from './prompt-builder.ts';
import { optimizeImageForGPT } from './image-optimizer.ts';
import { PerformanceTracker } from './performance-tracker.ts';
import type { ProcessStoryPageParams } from './types.ts';
import { ErrorHandler, StoryProcessingError, ErrorContext } from './error-handler.ts';

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

  const context: ErrorContext = {
    storyId,
    pageNumber,
    userId,
    operation: 'process_story_page',
    attempt: 1,
    timestamp: new Date().toISOString()
  };

  try {
    // Phase 2: Enhanced processing with comprehensive error handling
    const perf = new PerformanceTracker();
    console.log(`[GPT-Image-1 Edit] Phase 2: Processing page ${pageNumber} with enhanced error handling`);
    
    // Phase 2: Wrap critical operations in error handling
    const originalImageDataUrl = await ErrorHandler.handleWithRetry(
      () => fetchImageAsDataUrl(imageData.storageUrl),
      { ...context, operation: 'fetch_image' }
    );
    perf.checkpoint('image_fetch');
    
    const optimizedImageDataUrl = await ErrorHandler.handleWithRetry(
      () => optimizeImageForGPT(originalImageDataUrl),
      { ...context, operation: 'optimize_image' }
    );
    perf.checkpoint('image_optimization');
    
    const originalImageUrl = await ErrorHandler.handleWithRetry(
      () => uploadOriginalImageToSupabase(originalImageDataUrl, storyId, pageNumber, userId, supabase),
      { ...context, operation: 'upload_original' }
    );
    perf.checkpoint('original_upload');

    const transformationPrompt = buildPrompt(pageNumber, stylePrompt, characterDescriptions, artStyleGuidelines);
    console.log(`[GPT-Image-1 Edit] Phase 2: Built enhanced transformation prompt for page ${pageNumber}`);
    perf.checkpoint('prompt_build');

    // Phase 2: Critical GPT operation with enhanced error handling
    const editedImageUrl = await ErrorHandler.handleWithRetry(
      () => editImageWithGPT(optimizedImageDataUrl, transformationPrompt),
      { ...context, operation: 'gpt_image_edit' },
      3 // Max 3 retries for GPT operations
    );
    console.log(`[GPT-Image-1 Edit] Phase 2: Successfully edited image for page ${pageNumber}`);
    perf.checkpoint('gpt_edit');

    const finalImageUrl = await ErrorHandler.handleWithRetry(
      () => uploadImageToSupabase(editedImageUrl, storyId, pageNumber, userId, supabase),
      { ...context, operation: 'upload_final' }
    );
    perf.checkpoint('final_upload');

    // Create story page record
    await supabase
      .from('story_pages')
      .insert({
        story_id: storyId,
        page_number: pageNumber,
        original_image_url: originalImageUrl,
        generated_image_url: finalImageUrl,
        enhanced_prompt: transformationPrompt,
        transformation_status: 'completed'
      });

    perf.checkpoint('db_insert');
    perf.logSummary();
    console.log(`[GPT-Image-1 Edit] Phase 2: Successfully completed page ${pageNumber} with enhanced error handling`);
    
    return { 
      analysisText: transformationPrompt,
      generatedImageUrl: finalImageUrl, 
      originalImageUrl 
    };
  } catch (error) {
    console.error(`[GPT-Image-1 Edit] Phase 2: Enhanced error handling for page ${pageNumber}:`, error);
    
    // Phase 2: Enhanced error logging and recovery
    if (error instanceof StoryProcessingError) {
      await ErrorHandler.logError(error, supabase);
    }
    
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
