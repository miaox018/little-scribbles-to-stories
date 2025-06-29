
const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function analyzeImageWithGPT(imageDataUrl: string, prompt: string, retryCount = 0): Promise<string> {
  const maxRetries = 3;
  const baseDelay = 2000; // 2 seconds
  
  try {
    // Add delay between requests to avoid rate limiting
    if (retryCount > 0) {
      const delayMs = baseDelay * Math.pow(2, retryCount - 1); // Exponential backoff
      console.log(`Retrying after ${delayMs}ms delay (attempt ${retryCount + 1}/${maxRetries + 1})`);
      await delay(delayMs);
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: imageDataUrl } }
            ]
          }
        ],
        max_tokens: 1500
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      
      // Check if it's a rate limit error
      if (response.status === 429 || errorText.includes('rate limit') || errorText.includes('Error 1015')) {
        if (retryCount < maxRetries) {
          console.log(`Rate limited, retrying... (attempt ${retryCount + 1}/${maxRetries + 1})`);
          return await analyzeImageWithGPT(imageDataUrl, prompt, retryCount + 1);
        } else {
          throw new Error(`Rate limit exceeded after ${maxRetries + 1} attempts`);
        }
      }
      
      throw new Error(`Vision API failed: ${errorText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    if (retryCount < maxRetries && (error.message.includes('rate limit') || error.message.includes('Error 1015'))) {
      console.log(`Error caught, retrying... (attempt ${retryCount + 1}/${maxRetries + 1}): ${error.message}`);
      return await analyzeImageWithGPT(imageDataUrl, prompt, retryCount + 1);
    }
    throw error;
  }
}

export async function generateImageWithGPT(prompt: string, retryCount = 0): Promise<string> {
  const maxRetries = 3;
  const baseDelay = 3000; // 3 seconds for image generation
  
  try {
    // Add delay between requests to avoid rate limiting
    if (retryCount > 0) {
      const delayMs = baseDelay * Math.pow(2, retryCount - 1); // Exponential backoff
      console.log(`Retrying image generation after ${delayMs}ms delay (attempt ${retryCount + 1}/${maxRetries + 1})`);
      await delay(delayMs);
    }

    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: prompt,
        size: '1024x1792',
        quality: 'standard',
        n: 1
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      
      // Check if it's a rate limit error
      if (response.status === 429 || errorText.includes('rate limit') || errorText.includes('Error 1015')) {
        if (retryCount < maxRetries) {
          console.log(`Image generation rate limited, retrying... (attempt ${retryCount + 1}/${maxRetries + 1})`);
          return await generateImageWithGPT(prompt, retryCount + 1);
        } else {
          throw new Error(`Image generation rate limit exceeded after ${maxRetries + 1} attempts`);
        }
      }
      
      throw new Error(`Image generation failed: ${errorText}`);
    }

    const data = await response.json();
    return data.data[0].url;
  } catch (error) {
    if (retryCount < maxRetries && (error.message.includes('rate limit') || error.message.includes('Error 1015'))) {
      console.log(`Image generation error caught, retrying... (attempt ${retryCount + 1}/${maxRetries + 1}): ${error.message}`);
      return await generateImageWithGPT(prompt, retryCount + 1);
    }
    throw error;
  }
}
