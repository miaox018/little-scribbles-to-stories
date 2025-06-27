
import { analyzeImageWithGPT, generateImageWithGPT } from './openai-api.ts';
import { uploadImageToSupabase, uploadOriginalImageToSupabase } from './storage-utils.ts';
import { buildPrompt } from './prompt-builder.ts';
import type { ProcessStoryPageParams } from './types.ts';

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

  // Upload original image to Supabase
  const originalImageUrl = await uploadOriginalImageToSupabase(imageData.dataUrl, storyId, pageNumber, userId, supabase);

  // Build context prompt
  const prompt = buildPrompt(pageNumber, stylePrompt, characterDescriptions, artStyleGuidelines);

  // Analyze image with GPT-4o
  const analysisText = await analyzeImageWithGPT(imageData.dataUrl, prompt);
  console.log(`Generated analysis for page ${pageNumber}:`, analysisText);

  // Generate image with GPT-image-1
  const base64Image = await generateImageWithGPT(analysisText);

  // Upload generated image to Supabase Storage
  const generatedImageUrl = await uploadImageToSupabase(base64Image, storyId, pageNumber, userId, supabase);

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
}
