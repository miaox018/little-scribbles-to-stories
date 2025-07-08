
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { validateUserAuthentication, validateUserOwnership } from './auth-validation.ts';

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

// Enhanced input validation
function validateInput(input: any) {
  if (!input || typeof input !== 'object') {
    throw new Error('Invalid request body');
  }

  const { storyId, pageId, artStyle } = input;

  // Validate UUIDs
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  
  if (!storyId || !uuidRegex.test(storyId)) {
    throw new Error('Invalid story ID format');
  }
  
  if (!pageId || !uuidRegex.test(pageId)) {
    throw new Error('Invalid page ID format');
  }

  // Validate art style
  const allowedStyles = Object.keys(artStylePrompts);
  const validatedArtStyle = artStyle && allowedStyles.includes(artStyle) ? artStyle : 'classic_watercolor';

  return { storyId, pageId, artStyle: validatedArtStyle };
}

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
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  
  return btoa(binary);
}

// Build consistent prompt using meta-context
function buildRegenerationPrompt(
  pageNumber: number, 
  stylePrompt: string, 
  metaContext?: string
): string {
  let contextPrompt = "";
  
  if (metaContext) {
    // Use optimized character meta-context for enhanced consistency
    contextPrompt = `This is PAGE ${pageNumber} of a children's story book. MAINTAIN PERFECT CHARACTER CONSISTENCY:

${metaContext}

CRITICAL: Follow the above character guide EXACTLY to ensure visual consistency across all pages.

Use the following art style: ${stylePrompt}`;
  } else {
    // Fallback approach
    contextPrompt = `This is PAGE ${pageNumber} of a children's story book. Use the following art style: ${stylePrompt}`;
  }

  return `${contextPrompt}

Transform this child's hand-drawn story page into a professional children's book illustration.

🎨 CRITICAL LAYOUT REQUIREMENTS - HIGHEST PRIORITY:
- Create a PORTRAIT orientation illustration with 2:3 aspect ratio (1024x1536 pixels)
- Keep ALL main illustration elements within the CENTER 70% of the image
- Leave AT LEAST 15% margins on ALL SIDES (top, bottom, left, right)
- Reserve adequate space near edges for potential text placement
- Center the main action/characters in the middle safe zone
- Ensure no important visual elements are cut off at the edges

🔑 CRITICAL TEXT REQUIREMENTS - HIGHEST PRIORITY:
- Any text in the image must be EXACTLY readable, letter-perfect, and crystal clear
- Use clean, professional typography: Arial, Helvetica, or Times New Roman fonts ONLY
- Text must be large enough for children to read easily (minimum 16pt equivalent)
- Text should be CENTERED and well-positioned with high contrast against background
- Background behind text must be plain or very simple to ensure readability
- NO decorative fonts, NO handwriting styles, NO text effects or shadows
- NO misspellings - spell every word perfectly in English
- If there is dialogue or narration, display it in clean text boxes or speech bubbles with white/light backgrounds
- Text must be perfectly legible - this is NON-NEGOTIABLE

VISUAL REFERENCE ANALYSIS:
Carefully analyze the provided child's drawing to understand:
- Character appearances, clothing, and expressions
- Setting and background elements  
- Any text, dialogue, or narration present
- Story events happening on this page
- Emotional tone and mood

STYLE REQUIREMENTS:
- ${stylePrompt}
- Child-appropriate and friendly tone
- High detail but not scary or overwhelming
- Maintain story elements and characters from the original drawing
- Make it magical and enchanting while staying true to the child's vision
- Professional children's book illustration quality
- Optimize composition for portrait 2:3 aspect ratio with safe margins

CONSISTENCY REQUIREMENTS:
- If character descriptions are provided above, follow ALL character details exactly
- Keep the same color palette and artistic approach established in the story
- Ensure characters look identical to previous appearances
- Maintain established visual language and story world

FINAL CHECK: 
1. All important visual elements must be within the center 70% of the image
2. 15% margins must be maintained on all sides
3. Text must be as clear and readable as text in a printed children's book
4. The illustration must work perfectly in portrait orientation with proper safe margins`;
}

async function analyzeImageWithGPT(imageDataUrl: string, prompt: string, retryCount = 0): Promise<string> {
  const maxRetries = 3;
  const baseDelay = 2000; // 2 seconds
  
  try {
    if (retryCount > 0) {
      const delayMs = baseDelay * Math.pow(2, retryCount - 1);
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
  const baseDelay = 3000;
  
  try {
    if (retryCount > 0) {
      const delayMs = baseDelay * Math.pow(2, retryCount - 1);
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
        model: 'gpt-image-1',
        prompt: prompt,
        size: '1024x1536',
        quality: 'medium',
        n: 1
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      
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
    const base64Data = imageUrl.split(',')[1];
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    imageBuffer = new Uint8Array(byteNumbers);
  } else {
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
    // Validate authentication and get authenticated supabase client
    const { userId, supabase } = await validateUserAuthentication(req);
    console.log('Authenticated user:', userId);

    const requestBody = await req.json();
    const { storyId, pageId, artStyle } = validateInput(requestBody);

    console.log(`🔄 Starting regeneration for page ${pageId} in story ${storyId}`);

    // Validate user ownership
    await validateUserOwnership(supabase, userId, storyId);

    // Get the page and story data with character summary
    const { data: page, error: pageError } = await supabase
      .from('story_pages')
      .select('*, stories(user_id, title, art_style, character_summary, status)')
      .eq('id', pageId)
      .single();

    if (pageError || !page) {
      console.error('Page not found:', pageError);
      throw new Error('Page not found');
    }

    console.log(`📖 Story status: ${page.stories.status}`);

    // Allow regeneration for processing, completed, and partial stories (block only saved stories)
    if (page.stories.status === 'saved') {
      console.log('❌ Cannot regenerate pages for saved stories');
      throw new Error('Cannot regenerate pages for stories that have been saved to library');
    }

    // Set page status to processing to indicate regeneration in progress
    console.log('🔄 Setting page status to processing');
    await supabase
      .from('story_pages')
      .update({
        transformation_status: 'processing',
        updated_at: new Date().toISOString()
      })
      .eq('id', pageId);

    // Extract the file path from the original_image_url
    let filePath;
    if (page.original_image_url) {
      const urlParts = page.original_image_url.split('/');
      const storageIndex = urlParts.findIndex(part => part === 'story-images');
      if (storageIndex !== -1 && storageIndex < urlParts.length - 1) {
        filePath = urlParts.slice(storageIndex + 1).join('/');
      } else {
        const fileName = urlParts[urlParts.length - 1];
        filePath = `${page.stories.user_id}/${storyId}/${fileName}`;
      }
    }

    if (!filePath) {
      throw new Error('Could not determine file path for original image');
    }

    console.log(`📁 Downloading file from path: ${filePath}`);

    const { data: imageData, error: imageError } = await supabase.storage
      .from('story-images')
      .download(filePath);

    if (imageError) {
      console.error('Storage download error:', imageError);
      throw new Error(`Failed to retrieve original image: ${imageError.message}`);
    }

    const arrayBuffer = await imageData.arrayBuffer();
    
    if (arrayBuffer.byteLength > 10 * 1024 * 1024) {
      console.warn(`Large image detected: ${(arrayBuffer.byteLength / 1024 / 1024).toFixed(2)}MB`);
    }
    
    const base64 = arrayBufferToBase64(arrayBuffer);
    const dataUrl = `data:image/png;base64,${base64}`;

    const stylePrompt = artStylePrompts[artStyle as keyof typeof artStylePrompts] || artStylePrompts.classic_watercolor;
    
    // Use meta-context if available for character consistency
    const metaContext = page.stories.character_summary;
    console.log(`🎭 Using character meta-context: ${metaContext ? 'Yes' : 'No'}`);
    
    const prompt = buildRegenerationPrompt(page.page_number, stylePrompt, metaContext);

    console.log(`🎨 Starting regeneration with character consistency for page ${page.page_number}`);
    const analysisText = await analyzeImageWithGPT(dataUrl, prompt);
    console.log(`✅ Image analysis completed`);
    
    const imageUrl = await generateImageWithGPT(analysisText);
    console.log(`✅ Image generation completed`);
    
    const generatedImageUrl = await uploadImageToSupabase(
      imageUrl, 
      storyId, 
      page.page_number, 
      page.stories.user_id, 
      supabase
    );
    console.log(`✅ Image uploaded to storage: ${generatedImageUrl}`);

    // Update the page with the new generated image
    const { error: updateError } = await supabase
      .from('story_pages')
      .update({
        generated_image_url: generatedImageUrl,
        enhanced_prompt: analysisText,
        transformation_status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', pageId);

    if (updateError) {
      console.error('Failed to update page:', updateError);
      throw new Error(`Failed to update page: ${updateError.message}`);
    }

    console.log(`🎉 Successfully regenerated page ${pageId} with character consistency`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Page regenerated successfully with character consistency',
        generated_image_url: generatedImageUrl,
        page_id: pageId
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error in regenerate-page function:', error);
    
    let errorMessage = error.message;
    let statusCode = 500;
    
    // Parse JSON error messages
    try {
      const parsedError = JSON.parse(error.message);
      errorMessage = parsedError.error;
      statusCode = parsedError.code === 'UNAUTHORIZED' || parsedError.code === 'INVALID_TOKEN' ? 401 :
                   parsedError.code === 'OWNERSHIP_VIOLATION' || parsedError.code === 'STORY_ACCESS_DENIED' ? 403 : 500;
    } catch {
      // Not a JSON error, use original message
      statusCode = error.message.includes('Unauthorized') ? 403 :
                   error.message.includes('Invalid') ? 400 :
                   error.message.includes('Cannot regenerate') ? 403 : 500;
    }
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: statusCode,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
