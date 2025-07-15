const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function generateImageWithGPT(prompt: string, retryCount = 0): Promise<string> {
  const maxRetries = 3;
  const baseDelay = 3000; // 3 seconds for image generation
  
  try {
    console.log(`[GPT-Image-1] Starting image generation (attempt ${retryCount + 1}/${maxRetries + 1})`);
    console.log(`[GPT-Image-1] Prompt: ${prompt.substring(0, 100)}...`);
    
    // Add delay between requests to avoid rate limiting
    if (retryCount > 0) {
      const delayMs = baseDelay * Math.pow(2, retryCount - 1); // Exponential backoff
      console.log(`Retrying image generation after ${delayMs}ms delay (attempt ${retryCount + 1}/${maxRetries + 1})`);
      await delay(delayMs);
    }

    const requestBody = {
      model: 'gpt-image-1',  // GPT-Image-1 Only
      prompt: prompt,
      size: '1024x1536',     // Portrait format for children's books
      quality: 'medium',     // Medium quality for cost/quality balance
      n: 1
    };
    
    console.log(`[GPT-Image-1] Request config: ${JSON.stringify(requestBody, null, 2)}`);

    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log(`[GPT-Image-1] Response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[GPT-Image-1] API Error: ${response.status} - ${errorText}`);
      
      // Check if it's a rate limit error
      if (response.status === 429 || errorText.includes('rate limit') || errorText.includes('Error 1015')) {
        if (retryCount < maxRetries) {
          console.log(`GPT-Image-1 rate limited, retrying... (attempt ${retryCount + 1}/${maxRetries + 1})`);
          return await generateImageWithGPT(prompt, retryCount + 1);
        } else {
          throw new Error(`GPT-Image-1 rate limit exceeded after ${maxRetries + 1} attempts`);
        }
      }
      
      throw new Error(`GPT-Image-1 generation failed: ${errorText}`);
    }

    const data = await response.json();
    console.log(`[GPT-Image-1] Response data keys: ${Object.keys(data)}`);
    console.log(`[GPT-Image-1] Data.data length: ${data.data?.length}`);
    
    // GPT-Image-1 returns base64 or URL
    const result = data.data[0].b64_json ? `data:image/png;base64,${data.data[0].b64_json}` : data.data[0].url;
    console.log(`[GPT-Image-1] Image generation completed. Format: ${data.data[0].b64_json ? 'base64' : 'URL'}`);
    return result;
  } catch (error) {
    console.error(`[GPT-Image-1] Error: ${error.message}`);
    if (retryCount < maxRetries && (error.message.includes('rate limit') || error.message.includes('Error 1015'))) {
      console.log(`GPT-Image-1 error caught, retrying... (attempt ${retryCount + 1}/${maxRetries + 1}): ${error.message}`);
      return await generateImageWithGPT(prompt, retryCount + 1);
    }
    throw error;
  }
}
