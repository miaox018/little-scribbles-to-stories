
import { analyzeImageWithGPT, generateImageWithGPT, createMasterAnalysisWithGPT } from './openai-api.ts';
import { uploadImageToSupabase, uploadOriginalImageToSupabase } from './storage-utils.ts';
import { buildMasterAnalysisPrompt, buildPagePrompt } from './prompt-builder.ts';
import type { ProcessStoryPageParams, CreateMasterStoryAnalysisParams, MasterStoryContext } from './types.ts';

export async function createMasterStoryAnalysis({
  images,
  stylePrompt,
  storyId,
  supabase
}: CreateMasterStoryAnalysisParams): Promise<MasterStoryContext> {
  // Check if story was cancelled
  const { data: story } = await supabase
    .from('stories')
    .select('status')
    .eq('id', storyId)
    .single();

  if (story?.status === 'cancelled') {
    throw new Error('Story transformation was cancelled');
  }

  console.log(`Creating master analysis for ${images.length} pages`);

  // Build master analysis prompt
  const masterPrompt = buildMasterAnalysisPrompt(stylePrompt, images.length);

  // Send all images to GPT-4o for comprehensive analysis
  const masterAnalysis = await createMasterAnalysisWithGPT(
    images.map(img => img.dataUrl), 
    masterPrompt
  );

  console.log('Master story analysis created:', masterAnalysis.substring(0, 200) + '...');

  return {
    characterDescriptions: masterAnalysis,
    artStyleGuidelines: `- Art style: ${stylePrompt}\n- Consistent visual language established from master analysis\n- Portrait orientation with 3:4 aspect ratio and safe margins`,
    storyFlow: masterAnalysis
  };
}

export async function processStoryPage({
  imageData, 
  pageNumber, 
  storyId, 
  userId,
  stylePrompt,
  masterContext,
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

  console.log(`Processing page ${pageNumber} with master context`);

  // Upload original image to Supabase
  const originalImageUrl = await uploadOriginalImageToSupabase(imageData.dataUrl, storyId, pageNumber, userId, supabase);

  // Build page-specific prompt using master context
  const prompt = buildPagePrompt(pageNumber, stylePrompt, masterContext);

  // Analyze this specific page with GPT-4o using master context
  const analysisText = await analyzeImageWithGPT(imageData.dataUrl, prompt);
  console.log(`Generated analysis for page ${pageNumber}:`, analysisText.substring(0, 100) + '...');

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

  console.log(`Completed page ${pageNumber}`);
  return { analysisText, generatedImageUrl, originalImageUrl };
}
