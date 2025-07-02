
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const artStylePrompts = {
  classic_watercolor: "Classic watercolor illustration style with soft, flowing colors and organic textures",
  disney_animation: "Disney-style animation with bright, vibrant colors and smooth cartoon aesthetics",
  realistic_digital: "High-quality realistic digital art with detailed textures and lifelike proportions",
  manga_anime: "Japanese manga/anime art style with expressive characters and dynamic poses",
  vintage_storybook: "Classic vintage storybook illustration style reminiscent of 1950s children's books"
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

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

async function analyzeImageWithGPT(imageDataUrl: string, prompt: string, retryCount = 0): Promise<string> {
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

async function generateImageWithGPT(prompt: string, retryCount = 0): Promise<string> {
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
        model: 'gpt-image-1',  // Correct: Using GPT-image-1 as intended
        prompt: prompt,
        size: '1024x1536',     // Portrait format for children's books
        quality: 'medium',   // Standard quality for cost optimization
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
    // GPT-image-1 returns base64 data directly for some configurations
    return data.data[0].b64_json ? `data:image/png;base64,${data.data[0].b64_json}` : data.data[0].url;
  } catch (error) {
    if (retryCount < maxRetries && (error.message.includes('rate limit') || error.message.includes('Error 1015'))) {
      console.log(`Image generation error caught, retrying... (attempt ${retryCount + 1}/${maxRetries + 1}): ${error.message}`);
      return await generateImageWithGPT(prompt, retryCount + 1);
    }
    throw error;
  }
}

async function uploadImageToSupabase(imageUrl: string, storyId: string, pageNumber: number, userId: string, supabase: any) {
  let imageBuffer;
  
  if (imageUrl.startsWith('data:image/')) {
    // Handle base64 data URL using chunked processing
    const base64Data = imageUrl.split(',')[1];
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    imageBuffer = new Uint8Array(byteNumbers);
  } else {
    // Handle regular URL
    const imageResponse = await fetch(imageUrl);
    imageBuffer = await imageResponse.arrayBuffer();
  }
  
  const fileName = `${userId}/generated/${storyId}/page_${pageNumber}_${Date.now()}.png`;
  
  const { data, error } = await supabase.storage
    .from('story-images')
    .upload(fileName, imageBuffer, {
      contentType: 'image/png'
    });

  if (error) throw error;

  const { data: urlData } = supabase.storage
    .from('story-images')
    .getPublicUrl(fileName);

  return urlData.publicUrl;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { storyId, pageId, artStyle = 'classic_watercolor' } = await req.json();

    console.log(`Regenerating page ${pageId} for story ${storyId}`);

    // Get the page and story data
    const { data: page, error: pageError } = await supabase
      .from('story_pages')
      .select('*, stories(user_id, title, art_style)')
      .eq('id', pageId)
      .single();

    if (pageError || !page) {
      throw new Error('Page not found');
    }

    // Extract the file path from the original_image_url
    let filePath;
    if (page.original_image_url) {
      // Handle both full URLs and relative paths
      const urlParts = page.original_image_url.split('/');
      const storageIndex = urlParts.findIndex(part => part === 'story-images');
      if (storageIndex !== -1 && storageIndex < urlParts.length - 1) {
        // Extract everything after 'story-images/'
        filePath = urlParts.slice(storageIndex + 1).join('/');
      } else {
        // Fallback: try to extract from the end of the URL
        const fileName = urlParts[urlParts.length - 1];
        filePath = `${page.stories.user_id}/${storyId}/${fileName}`;
      }
    }

    if (!filePath) {
      throw new Error('Could not determine file path for original image');
    }

    console.log(`Downloading file from path: ${filePath}`);

    // Get the original image data from storage
    const { data: imageData, error: imageError } = await supabase.storage
      .from('story-images')
      .download(filePath);

    if (imageError) {
      console.error('Storage download error:', imageError);
      throw new Error(`Failed to retrieve original image: ${imageError.message}`);
    }

    // Convert to data URL using chunked processing
    const arrayBuffer = await imageData.arrayBuffer();
    
    // Log warning for large images
    if (arrayBuffer.byteLength > 10 * 1024 * 1024) { // 10MB
      console.warn(`Large image detected: ${(arrayBuffer.byteLength / 1024 / 1024).toFixed(2)}MB`);
    }
    
    const base64 = arrayBufferToBase64(arrayBuffer);
    const dataUrl = `data:image/png;base64,${base64}`;

    // Build prompt
    const stylePrompt = artStylePrompts[artStyle as keyof typeof artStylePrompts] || artStylePrompts.classic_watercolor;
    const prompt = `Transform this child's hand-drawn story page into a professional ${stylePrompt} illustration. 
    
    Keep the original story, characters, and composition but enhance it with:
    - Professional art quality while maintaining the child's creative vision
    - ${stylePrompt}
    - Clear, readable text if present
    - Portrait orientation (3:4 aspect ratio)
    - Appropriate for children's book illustration
    
    Maintain the essence and charm of the original drawing while making it publication-ready.`;

    // Analyze and generate new image
    const analysisText = await analyzeImageWithGPT(dataUrl, prompt);
    const imageUrl = await generateImageWithGPT(analysisText);
    
    // Upload new generated image
    const generatedImageUrl = await uploadImageToSupabase(
      imageUrl, 
      storyId, 
      page.page_number, 
      page.stories.user_id, 
      supabase
    );

    // Update the page record
    await supabase
      .from('story_pages')
      .update({
        generated_image_url: generatedImageUrl,
        enhanced_prompt: analysisText,
        transformation_status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', pageId);

    console.log(`Successfully regenerated page ${pageId}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Page regenerated successfully',
        generated_image_url: generatedImageUrl
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in regenerate-page function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
