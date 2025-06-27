
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

// CORS headers - duplicated here to avoid import issues
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Art style prompts - duplicated here to avoid import issues
const artStylePrompts = {
  classic_watercolor: "Transform this into a beautiful children's book illustration with soft watercolor style, warm colors, and gentle brushstrokes. Maintain the same characters and scene but enhance with artistic flair suitable for ages 3-8.",
  modern_digital: "Create a vibrant, modern digital illustration perfect for children's books with clean lines, bright colors, and contemporary art style.",
  vintage_storybook: "Transform into a classic vintage storybook illustration with timeless charm, soft edges, and traditional children's book aesthetics."
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

// OpenAI API functions - duplicated here to avoid import issues
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
      quality: 'standard',
      output_format: 'png',
      n: 1
    }),
  });

  if (!response.ok) {
    throw new Error(`Image generation failed: ${await response.text()}`);
  }

  const data = await response.json();
  return data.data[0].b64_json;
}

// Story page processing function - simplified version
async function processStoryPage(params: {
  imageData: { url: string; dataUrl: string };
  pageNumber: number;
  storyId: string;
  userId: string;
  stylePrompt: string;
  characterDescriptions: string;
  artStyleGuidelines: string;
  supabase: any;
}) {
  const { imageData, pageNumber, storyId, userId, stylePrompt, supabase } = params;

  console.log(`Processing page ${pageNumber} for story ${storyId}`);

  // Analyze the original image
  const analysisPrompt = `Analyze this children's book page image and create a detailed description for regenerating it as an illustration. Focus on:
1. Characters: Describe their appearance, clothing, expressions, and poses in detail
2. Setting: Describe the environment, background, and atmosphere
3. Actions: What is happening in the scene
4. Text elements: Note any text placement and style
5. Composition: How elements are arranged on the page

Provide a comprehensive description that would allow someone to recreate this scene as a children's book illustration.`;

  const analysisResult = await analyzeImageWithGPT(imageData.dataUrl, analysisPrompt);

  // Create enhanced prompt for image generation
  const enhancedPrompt = `${stylePrompt}

Scene Description: ${analysisResult}

Additional Requirements:
- Create in portrait orientation (3:4 aspect ratio)
- Ensure safe margins for text if needed
- Use warm, inviting colors suitable for children
- Maintain consistent character designs
- High quality children's book illustration style`;

  console.log(`Generated enhanced prompt for page ${pageNumber}`);

  // Generate the new image
  const generatedImageBase64 = await generateImageWithGPT(enhancedPrompt);

  // Convert base64 to data URL
  const generatedImageDataUrl = `data:image/png;base64,${generatedImageBase64}`;

  // Insert/update the story page
  const { error: insertError } = await supabase
    .from('story_pages')
    .upsert({
      story_id: storyId,
      page_number: pageNumber,
      original_image_url: imageData.url,
      generated_image_url: generatedImageDataUrl,
      enhanced_prompt: enhancedPrompt,
      transformation_status: 'completed'
    });

  if (insertError) {
    throw new Error(`Failed to save page ${pageNumber}: ${insertError.message}`);
  }

  console.log(`Successfully processed and saved page ${pageNumber}`);
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { storyId, pageNumber, artStyle = 'classic_watercolor' } = await req.json();

    console.log(`Regenerating page ${pageNumber} for story ${storyId}`);

    // Get the story and original image data
    const { data: story, error: storyError } = await supabase
      .from('stories')
      .select('user_id')
      .eq('id', storyId)
      .single();

    if (storyError || !story) {
      throw new Error('Story not found');
    }

    // Get the original page data
    const { data: pageData, error: pageError } = await supabase
      .from('story_pages')
      .select('original_image_url')
      .eq('story_id', storyId)
      .eq('page_number', pageNumber)
      .single();

    if (pageError || !pageData?.original_image_url) {
      throw new Error('Original page image not found');
    }

    // Convert the stored image URL to data URL for processing
    const imageResponse = await fetch(pageData.original_image_url);
    const imageBlob = await imageResponse.blob();
    const imageDataUrl = `data:${imageBlob.type};base64,${btoa(String.fromCharCode(...new Uint8Array(await imageBlob.arrayBuffer())))}`;

    // Delete the existing failed page record
    await supabase
      .from('story_pages')
      .delete()
      .eq('story_id', storyId)
      .eq('page_number', pageNumber);

    // Get the style prompt
    const stylePrompt = artStylePrompts[artStyle as keyof typeof artStylePrompts] || artStylePrompts.classic_watercolor;

    // Process the page again
    await processStoryPage({
      imageData: { url: pageData.original_image_url, dataUrl: imageDataUrl },
      pageNumber,
      storyId,
      userId: story.user_id,
      stylePrompt,
      characterDescriptions: "",
      artStyleGuidelines: "",
      supabase
    });

    console.log(`Successfully regenerated page ${pageNumber} for story ${storyId}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Page ${pageNumber} regenerated successfully`
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
