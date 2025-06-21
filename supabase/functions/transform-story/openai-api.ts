
const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

export async function analyzeImageWithGPT(imageDataUrl: string, prompt: string) {
  console.log('Analyzing image with GPT-4o, prompt length:', prompt.length);
  
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
      max_tokens: 1000
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Vision API failed:', errorText);
    throw new Error(`Vision API failed: ${errorText}`);
  }

  const data = await response.json();
  const analysisResult = data.choices[0].message.content;
  console.log('GPT-4o analysis result length:', analysisResult.length);
  
  return analysisResult;
}

export async function generateImageWithGPT(prompt: string) {
  console.log('Generating image with gpt-image-1, prompt length:', prompt.length);
  
  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-image-1',
      prompt: prompt,
      size: '1024x1024',
      quality: 'high',
      output_format: 'png',
      n: 1
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Image generation failed:', errorText);
    throw new Error(`Image generation failed: ${errorText}`);
  }

  const data = await response.json();
  const base64Image = data.data[0].b64_json;
  
  console.log('Generated image base64 length:', base64Image.length);
  console.log('Generated image details:', {
    hasImage: !!base64Image,
    base64Prefix: base64Image.substring(0, 50),
    estimatedSizeKB: Math.round(base64Image.length * 0.75 / 1024)
  });
  
  return base64Image;
}
