
import { analyzeImageWithGPT, generateImageWithGPT } from './openai-api.ts';
import { uploadImageToSupabase, uploadOriginalImageToSupabase } from './storage-utils.ts';
import { buildPrompt } from './prompt-builder.ts';
import type { ProcessStoryPageParams } from './types.ts';

// Function to fetch image from URL and convert to base64
async function fetchImageAsDataUrl(imageUrl: string): Promise<string> {
  try {
    console.log(`Fetching image from URL: ${imageUrl}`);
    const response = await fetch(imageUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    
    const dataUrl = `data:${contentType};base64,${base64}`;
    console.log(`Successfully converted image to data URL (length: ${dataUrl.length})`);
    
    return dataUrl;
  } catch (error) {
    console.error('Error fetching image as data URL:', error);
    throw error;
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
    // Fetch the original image from storage URL and convert to data URL for processing
    const originalImageDataUrl = await fetchImageAsDataUrl(imageData.storageUrl);
    
    // Upload original image to permanent storage (from the storage URL we already have)
    const originalImageUrl = await uploadOriginalImageToSupabase(originalImageDataUrl, storyId, pageNumber, userId, supabase);

    // Build context prompt
    const prompt = buildPrompt(pageNumber, stylePrompt, characterDescriptions, artStyleGuidelines);

    // Analyze image with GPT-4o using the data URL
    const analysisText = await analyzeImageWithGPT(originalImageDataUrl, prompt);
    console.log(`Generated analysis for page ${pageNumber}:`, analysisText);

    // Generate image with DALL-E 3
    const imageUrl = await generateImageWithGPT(analysisText);

    // Upload generated image to Supabase Storage
    const generatedImageUrl = await uploadImageToSupabase(imageUrl, storyId, pageNumber, userId, supabase);

    // Create story page record with Supabase URLs
    await supabase
      .from('story_pages')
      .insert({
        story_id: storyId,
        page_number: pageNumber,
        original_image_url: originalImageUrl,
        generated_image_url: generatedImageUrl,
        enhanced_prompt: analysisText,
        transformation_status: 'completed'
      });

    return { analysisText, generatedImageUrl, originalImageUrl };
  } catch (error) {
    console.error(`Error processing page ${pageNumber}:`, error);
    
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
