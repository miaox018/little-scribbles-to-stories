
const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function editImageWithGPT(imageDataUrl: string, prompt: string, retryCount = 0): Promise<string> {
  const maxRetries = 3;
  const baseDelay = 1000; // Phase 1 optimization: Reduced from 3s to 1s for retry delays
  
  try {
    console.log(`[GPT-Image-1 Edit] Starting image editing (attempt ${retryCount + 1}/${maxRetries + 1})`);
    console.log(`[GPT-Image-1 Edit] Prompt: ${prompt.substring(0, 100)}...`);
    
    // Phase 1 optimization: Faster retry delays
    if (retryCount > 0) {
      const delayMs = baseDelay * Math.pow(2, retryCount - 1); // Exponential backoff
      console.log(`Retrying image editing after ${delayMs}ms delay (attempt ${retryCount + 1}/${maxRetries + 1})`);
      await delay(delayMs);
    }

    // Convert data URL to File object for the API
    const base64Data = imageDataUrl.split(',')[1];
    const mimeType = imageDataUrl.split(',')[0].split(':')[1].split(';')[0];
    
    // Convert base64 to blob
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const imageBlob = new Blob([byteArray], { type: mimeType });

    // Create form data for the API
    const formData = new FormData();
    formData.append('image', imageBlob, 'image.png');
    formData.append('model', 'gpt-image-1');
    formData.append('prompt', prompt);
    formData.append('size', '1024x1536'); // Phase 1 optimization: Fixed size for faster processing
    formData.append('quality', 'medium'); // Phase 1 optimization: Medium quality for faster generation
    formData.append('output_format', 'png'); // Phase 1 optimization: PNG format for compatibility
    formData.append('n', '1');
    
    console.log(`[GPT-Image-1 Edit] Sending image edit request`);

    const response = await fetch('https://api.openai.com/v1/images/edits', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
      },
      body: formData,
    });

    console.log(`[GPT-Image-1 Edit] Response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[GPT-Image-1 Edit] API Error: ${response.status} - ${errorText}`);
      
      // Check if it's a rate limit error
      if (response.status === 429 || errorText.includes('rate limit') || errorText.includes('Error 1015')) {
        if (retryCount < maxRetries) {
          console.log(`GPT-Image-1 edit rate limited, retrying... (attempt ${retryCount + 1}/${maxRetries + 1})`);
          return await editImageWithGPT(imageDataUrl, prompt, retryCount + 1);
        } else {
          throw new Error(`GPT-Image-1 edit rate limit exceeded after ${maxRetries + 1} attempts`);
        }
      }
      
      throw new Error(`GPT-Image-1 edit failed: ${errorText}`);
    }

    const data = await response.json();
    console.log(`[GPT-Image-1 Edit] Response data keys: ${Object.keys(data)}`);
    console.log(`[GPT-Image-1 Edit] Data.data length: ${data.data?.length}`);
    
    // GPT-Image-1 edits return base64 or URL
    const result = data.data[0].b64_json ? `data:image/png;base64,${data.data[0].b64_json}` : data.data[0].url;
    console.log(`[GPT-Image-1 Edit] Image editing completed. Format: ${data.data[0].b64_json ? 'base64' : 'URL'}`);
    return result;
  } catch (error) {
    console.error(`[GPT-Image-1 Edit] Error: ${error.message}`);
    if (retryCount < maxRetries && (error.message.includes('rate limit') || error.message.includes('Error 1015'))) {
      console.log(`GPT-Image-1 edit error caught, retrying... (attempt ${retryCount + 1}/${maxRetries + 1}): ${error.message}`);
      return await editImageWithGPT(imageDataUrl, prompt, retryCount + 1);
    }
    throw error;
  }
}
