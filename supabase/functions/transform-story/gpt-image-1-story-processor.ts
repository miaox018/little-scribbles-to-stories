// GPT-Image-1 Only Story Processor
// 专门处理直接使用GPT-Image-1进行故事转换的流程

import { smartTransformWithGPTImage1 } from './gpt-image-1-api.ts';
import { buildGPTImage1OnlyPrompt, extractCharacterDescriptionsFromImage, validateGPTImage1Result } from './prompt-builder.ts';
import { uploadImageToSupabase, uploadOriginalImageToSupabase } from './storage-utils.ts';
import type { ProcessStoryPageParams, StoryPageResult, StoryPageError } from './types.ts';

// 将ArrayBuffer转换为base64的安全函数
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const CHUNK_SIZE = 32768; // 32KB chunks
  let binary = '';
  
  console.log(`Converting ArrayBuffer to base64: ${bytes.length} bytes`);
  
  for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
    const chunk = bytes.subarray(i, i + CHUNK_SIZE);
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  
  return btoa(binary);
}

// 从存储URL获取图像并转换为data URL
async function fetchImageAsDataUrl(storageUrl: string): Promise<string> {
  console.log(`Fetching image from storage URL: ${storageUrl}`);
  
  const response = await fetch(storageUrl);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
  }
  
  const arrayBuffer = await response.arrayBuffer();
  const base64 = arrayBufferToBase64(arrayBuffer);
  
  // 检测图像类型
  const contentType = response.headers.get('content-type') || 'image/png';
  return `data:${contentType};base64,${base64}`;
}

// GPT-Image-1 Only 处理单个故事页面
export async function processStoryPageWithGPTImage1Only({
  imageData, 
  pageNumber, 
  storyId, 
  userId,
  stylePrompt,
  characterDescriptions,
  supabase
}: ProcessStoryPageParams) {
  
  // 检查故事是否被取消
  const { data: story } = await supabase
    .from('stories')
    .select('status')
    .eq('id', storyId)
    .single();

  if (story?.status === 'cancelled') {
    throw new Error('Story transformation was cancelled');
  }

  try {
    console.log(`[GPT-Image-1 Processor] Starting page ${pageNumber} processing`);
    
    // 获取原始图像并转换为data URL
    const originalImageDataUrl = await fetchImageAsDataUrl(imageData.storageUrl);
    
    // 上传原始图像到永久存储
    const originalImageUrl = await uploadOriginalImageToSupabase(
      originalImageDataUrl, 
      storyId, 
      pageNumber, 
      userId, 
      supabase
    );

    // 构建GPT-Image-1专用提示词
    const prompt = buildGPTImage1OnlyPrompt(pageNumber, stylePrompt, characterDescriptions);
    console.log(`[GPT-Image-1 Processor] Generated prompt for page ${pageNumber}`);

    // 使用GPT-Image-1直接转换图像
    const transformedImageDataUrl = await smartTransformWithGPTImage1(
      originalImageDataUrl, 
      prompt, 
      pageNumber
    );

    // 验证生成结果
    const validation = validateGPTImage1Result({ 
      data: [{ b64_json: transformedImageDataUrl.split(',')[1] }] 
    });
    
    if (!validation.isValid) {
      throw new Error(`GPT-Image-1 result validation failed: ${validation.reason}`);
    }

    // 上传生成的图像到Supabase Storage
    const generatedImageUrl = await uploadImageToSupabase(
      transformedImageDataUrl, 
      storyId, 
      pageNumber, 
      userId, 
      supabase
    );

    // 为第一页提取角色描述，供后续页面使用
    let extractedCharacterDescriptions = '';
    if (pageNumber === 1) {
      extractedCharacterDescriptions = extractCharacterDescriptionsFromImage({
        pageNumber,
        generatedImageUrl,
        originalImageUrl,
        prompt
      });
      console.log(`[GPT-Image-1 Processor] Extracted character descriptions for future consistency`);
    }

    // 创建故事页面记录
    await supabase
      .from('story_pages')
      .insert({
        story_id: storyId,
        page_number: pageNumber,
        original_image_url: originalImageUrl,
        generated_image_url: generatedImageUrl,
        enhanced_prompt: prompt, // 存储使用的提示词
        transformation_status: 'completed'
      });

    console.log(`[GPT-Image-1 Processor] Page ${pageNumber} completed successfully`);

    return { 
      analysisText: prompt, 
      generatedImageUrl, 
      originalImageUrl,
      characterDescriptions: extractedCharacterDescriptions
    };

  } catch (error) {
    console.error(`[GPT-Image-1 Processor] Error processing page ${pageNumber}:`, error);
    
    // 记录失败的页面
    await supabase
      .from('story_pages')
      .insert({
        story_id: storyId,
        page_number: pageNumber,
        original_image_url: null,
        generated_image_url: null,
        enhanced_prompt: null,
        transformation_status: 'failed'
      });

    throw error;
  }
}

// 批量处理多页面的GPT-Image-1 only流程
export async function processBatchWithGPTImage1Only(
  storyId: string,
  imageUrls: string[],
  artStyle: string,
  userId: string,
  supabase: any
) {
  console.log(`[GPT-Image-1 Batch] Starting batch processing for ${imageUrls.length} pages`);
  
  const results: (StoryPageResult | StoryPageError)[] = [];
  let accumulatedCharacterDescriptions = '';
  
  for (let i = 0; i < imageUrls.length; i++) {
    const pageNumber = i + 1;
    
    try {
      const result = await processStoryPageWithGPTImage1Only({
        imageData: { storageUrl: imageUrls[i] },
        pageNumber,
        storyId,
        userId,
        stylePrompt: artStyle,
        characterDescriptions: accumulatedCharacterDescriptions,
        supabase
      });
      
      // 累积角色描述供后续页面使用
      if (result.characterDescriptions) {
        accumulatedCharacterDescriptions = result.characterDescriptions;
      }
      
      results.push(result);
      
      // 页面间添加延迟避免rate limiting
      if (i < imageUrls.length - 1) {
        console.log(`[GPT-Image-1 Batch] Waiting 5 seconds before next page...`);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
      
    } catch (error) {
      console.error(`[GPT-Image-1 Batch] Failed to process page ${pageNumber}:`, error);
      results.push({ error: error.message, pageNumber } as StoryPageError);
    }
  }
  
  // 更新故事状态
  const successfulPages = results.filter(r => !('error' in r)).length;
  const storyStatus = successfulPages === imageUrls.length ? 'completed' : 
                     successfulPages > 0 ? 'partial' : 'failed';
  
  await supabase
    .from('stories')
    .update({ 
      status: storyStatus,
      completed_at: new Date().toISOString()
    })
    .eq('id', storyId);
  
  console.log(`[GPT-Image-1 Batch] Batch processing completed. Status: ${storyStatus}`);
  
  return {
    success: true,
    status: storyStatus,
    processedPages: successfulPages,
    totalPages: imageUrls.length,
    results
  };
} 