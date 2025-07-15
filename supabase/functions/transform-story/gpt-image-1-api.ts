// GPT-Image-1 Only API 处理模块
// 直接使用儿童手绘图像作为输入，通过image edit模式生成专业插图

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

// 延迟函数
async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 将ArrayBuffer转换为Blob文件格式
function arrayBufferToBlob(buffer: ArrayBuffer, mimeType: string): Blob {
  return new Blob([buffer], { type: mimeType });
}

// GPT-Image-1 图像编辑API调用
export async function transformImageWithGPTImage1(
  imageDataUrl: string,
  prompt: string,
  pageNumber: number = 1,
  retryCount = 0
): Promise<string> {
  const maxRetries = 3;
  const baseDelay = 3000; // 3秒基础延迟
  
  try {
    console.log(`[GPT-Image-1] Starting image transformation for page ${pageNumber} (attempt ${retryCount + 1}/${maxRetries + 1})`);
    console.log(`[GPT-Image-1] Prompt length: ${prompt.length} characters`);
    
    // 添加重试延迟
    if (retryCount > 0) {
      const delayMs = baseDelay * Math.pow(2, retryCount - 1);
      console.log(`[GPT-Image-1] Retrying after ${delayMs}ms delay`);
      await delay(delayMs);
    }

    // 将data URL转换为blob
    const response = await fetch(imageDataUrl);
    const imageBlob = await response.blob();
    
    // 创建FormData用于图像编辑API
    const formData = new FormData();
    formData.append('model', 'gpt-image-1');
    formData.append('prompt', prompt);
    formData.append('size', '1024x1536'); // 2:3比例，适合儿童书
    formData.append('response_format', 'b64_json');
    formData.append('image', imageBlob, 'child_drawing.png');

    const apiResponse = await fetch('https://api.openai.com/v1/images/edits', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        // 注意：使用FormData时不要设置Content-Type，让浏览器自动设置
      },
      body: formData
    });

    console.log(`[GPT-Image-1] API Response status: ${apiResponse.status}`);

    if (!apiResponse.ok) {
      const errorData = await apiResponse.text();
      console.error(`[GPT-Image-1] API Error ${apiResponse.status}: ${errorData}`);
      
      // 处理rate limiting
      if (apiResponse.status === 429 && retryCount < maxRetries) {
        console.log(`[GPT-Image-1] Rate limited. Retrying... (attempt ${retryCount + 1}/${maxRetries})`);
        return await transformImageWithGPTImage1(imageDataUrl, prompt, pageNumber, retryCount + 1);
      }
      
      throw new Error(`GPT-Image-1 API error: ${apiResponse.status} - ${errorData}`);
    }

    const data = await apiResponse.json();
    
    if (!data.data || !data.data[0] || !data.data[0].b64_json) {
      throw new Error('Invalid response format from GPT-Image-1 API');
    }

    const imageBase64 = data.data[0].b64_json;
    console.log(`[GPT-Image-1] Image generated successfully for page ${pageNumber}`);
    console.log(`[GPT-Image-1] Response data length: ${imageBase64.length} characters`);
    
    // 返回data URL格式
    return `data:image/png;base64,${imageBase64}`;
    
  } catch (error) {
    console.error(`[GPT-Image-1] Error on attempt ${retryCount + 1}:`, error);
    
    if (retryCount < maxRetries) {
      console.log(`[GPT-Image-1] Retrying... (attempt ${retryCount + 1}/${maxRetries})`);
      return await transformImageWithGPTImage1(imageDataUrl, prompt, pageNumber, retryCount + 1);
    }
    
    throw error;
  }
}

// 备用方案：如果edit模式失败，使用generate模式
export async function generateImageWithGPTImage1(
  prompt: string,
  pageNumber: number = 1,
  retryCount = 0
): Promise<string> {
  const maxRetries = 3;
  const baseDelay = 3000;
  
  try {
    console.log(`[GPT-Image-1 Generate] Starting image generation for page ${pageNumber} (attempt ${retryCount + 1}/${maxRetries + 1})`);
    
    if (retryCount > 0) {
      const delayMs = baseDelay * Math.pow(2, retryCount - 1);
      console.log(`[GPT-Image-1 Generate] Retrying after ${delayMs}ms delay`);
      await delay(delayMs);
    }

    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-image-1',
        prompt: prompt,
        size: '1024x1536',
        response_format: 'b64_json',
        quality: 'standard'
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error(`[GPT-Image-1 Generate] API Error ${response.status}: ${errorData}`);
      
      if (response.status === 429 && retryCount < maxRetries) {
        return await generateImageWithGPTImage1(prompt, pageNumber, retryCount + 1);
      }
      
      throw new Error(`GPT-Image-1 generation error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    const imageBase64 = data.data[0].b64_json;
    
    console.log(`[GPT-Image-1 Generate] Image generated successfully for page ${pageNumber}`);
    return `data:image/png;base64,${imageBase64}`;
    
  } catch (error) {
    console.error(`[GPT-Image-1 Generate] Error on attempt ${retryCount + 1}:`, error);
    
    if (retryCount < maxRetries) {
      return await generateImageWithGPTImage1(prompt, pageNumber, retryCount + 1);
    }
    
    throw error;
  }
}

// 智能选择API模式：优先使用edit模式，失败时fallback到generate模式
export async function smartTransformWithGPTImage1(
  imageDataUrl: string,
  prompt: string,
  pageNumber: number = 1
): Promise<string> {
  try {
    // 首先尝试image edit模式（保持儿童创意）
    console.log(`[GPT-Image-1 Smart] Attempting edit mode for page ${pageNumber}`);
    return await transformImageWithGPTImage1(imageDataUrl, prompt, pageNumber);
    
  } catch (editError) {
    console.warn(`[GPT-Image-1 Smart] Edit mode failed, falling back to generate mode:`, editError);
    
    // 如果edit模式失败，使用generate模式
    const enhancedPrompt = `Based on a child's hand-drawn story page: ${prompt}`;
    return await generateImageWithGPTImage1(enhancedPrompt, pageNumber);
  }
} 