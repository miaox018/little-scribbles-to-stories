
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
      model: 'dall-e-3',
      prompt: prompt,
      size: '1024x1792',
      quality: 'standard',
      n: 1
    }),
  });

  if (!response.ok) {
    throw new Error(`Image generation failed: ${await response.text()}`);
  }

  const data = await response.json();
  return data.data[0].url;
}
