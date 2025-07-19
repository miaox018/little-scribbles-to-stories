import { Configuration, OpenAI } from "https://esm.sh/openai@4.11.1";
import { artStylePrompts } from './config.ts';
import { ErrorHandler, StoryProcessingError, ErrorContext } from './error-handler.ts';
import { openaiCircuitBreaker } from './circuit-breaker.ts';

const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

if (!openaiApiKey) {
  console.error('Missing OPENAI_API_KEY environment variable');
  Deno.exit(1);
}

const configuration = new Configuration({
  apiKey: openaiApiKey,
});

const openai = new OpenAI(configuration);

export async function editImageWithGPT(imageDataUrl: string, prompt: string): Promise<string> {
  console.log('[GPT-Image-1 Edit] Phase 2: Starting enhanced image editing with comprehensive error handling');
  
  const context: ErrorContext = {
    storyId: 'unknown',
    pageNumber: 0,
    userId: 'unknown',
    operation: 'gpt_image_edit',
    attempt: 1,
    timestamp: new Date().toISOString()
  };
  
  const operation = async (): Promise<string> => {
    console.log('[GPT-Image-1 Edit] Making API call with circuit breaker protection...');
    
    const response = await fetch('https://api.openai.com/v1/images/edits', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-image-1',
        image: imageDataUrl,
        prompt: prompt,
        n: 1,
        quality: 'high', // Phase 2: Use high quality for better results
        output_format: 'png',
        background: 'opaque' // Phase 2: Explicit background setting
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[GPT-Image-1 Edit] API Error Response:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: errorText
      });
      
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    console.log('[GPT-Image-1 Edit] API Response received successfully');
    
    if (!data.data || !data.data[0] || !data.data[0].b64_json) {
      throw new Error('Invalid response format from OpenAI API');
    }

    // Phase 2: Return the base64 data directly (GPT-Image-1 always returns base64)
    const base64Image = data.data[0].b64_json;
    return `data:image/png;base64,${base64Image}`;
  };
  
  try {
    // Phase 2: Use circuit breaker and enhanced error handling
    return await openaiCircuitBreaker.execute(async () => {
      return await ErrorHandler.handleWithRetry(operation, context, 3);
    });
  } catch (error) {
    console.error('[GPT-Image-1 Edit] Phase 2: Enhanced error handling caught error:', error);
    
    // Phase 2: Comprehensive error logging
    if (error instanceof StoryProcessingError) {
      console.error('[GPT-Image-1 Edit] StoryProcessingError details:', {
        code: error.code,
        retryable: error.retryable,
        context: error.context
      });
    }
    
    throw error;
  }
}
