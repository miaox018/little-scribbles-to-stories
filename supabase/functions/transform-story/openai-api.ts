

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

export async function analyzeImageWithGPT(imageDataUrl: string, prompt: string) {
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

export async function generateImageWithGPT(prompt: string) {
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

export async function generateMemoryCollage(originalImages: string[], storyTitle: string) {
  const collagePrompt = `Create a beautiful memory collage page for a children's storybook titled "${storyTitle}". 
  
  This should be a final page that celebrates all the original drawings from the story. Design it as a scrapbook-style collage with:
  - A warm, nostalgic border
  - Space for multiple small drawings arranged artistically
  - Text that says "My Original Drawings" or "Memory Page"
  - Decorative elements like stars, hearts, or frames
  - A layout that would showcase ${originalImages.length} different drawings
  - Portrait orientation (3:4 aspect ratio)
  - Soft, warm colors that complement a children's book
  
  Style: Watercolor illustration style with hand-drawn elements, suitable for a children's storybook finale.`;

  return await generateImageWithGPT(collagePrompt);
}

