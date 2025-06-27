
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

async function analyzeImageWithGPT(imageDataUrl: string, prompt: string) {
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
    throw new Error(`Vision API failed: ${await response.text()}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function generateImageWithGPT(prompt: string) {
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
      quality: 'high',
      output_format: 'png',
      n: 1
    }),
  });

  if (!response.ok) {
    throw new Error(`Image generation failed: ${await response.text()}`);
  }

  const data = await response.json();
  // gpt-image-1 returns base64 data directly
  return data.data[0].b64_json ? `data:image/png;base64,${data.data[0].b64_json}` : data.data[0].url;
}

async function uploadImageToSupabase(imageUrl: string, storyId: string, pageNumber: number, userId: string, supabase: any) {
  let imageBuffer;
  
  if (imageUrl.startsWith('data:image/')) {
    // Handle base64 data URL
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

    // Convert to data URL
    const arrayBuffer = await imageData.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
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
