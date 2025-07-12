
import { analyzeImageWithGPT } from './openai-api.ts';

interface CharacterAnalysisResult {
  pageNumber: number;
  characterDescription: string;
  success: boolean;
}

export async function analyzeCharactersInPages(
  imageUrls: Array<{ storageUrl: string; pageNumber: number }>,
  supabase: any
): Promise<CharacterAnalysisResult[]> {
  console.log(`Starting character analysis for ${imageUrls.length} pages`);
  
  const results: CharacterAnalysisResult[] = [];
  
  // Sequential processing with rate limiting
  for (const imageData of imageUrls) {
    try {
      console.log(`Analyzing characters in page ${imageData.pageNumber}`);
      
      // Fetch image and convert to data URL
      const response = await fetch(imageData.storageUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      const contentType = response.headers.get('content-type') || 'image/jpeg';
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      const dataUrl = `data:${contentType};base64,${base64}`;
      
      // Minimal character analysis prompt
      const characterPrompt = `Describe the main characters' visual traits in this drawing. Focus only on:
- Character appearances (hair, eyes, clothing, colors, accessories)
- Age and size of characters
- Distinctive features that help identify each character

Ignore background, setting, text, and layout. Keep descriptions concise and focused on visual consistency.`;

      const characterDescription = await analyzeImageWithGPT(dataUrl, characterPrompt);
      
      results.push({
        pageNumber: imageData.pageNumber,
        characterDescription,
        success: true
      });
      
      console.log(`Character analysis completed for page ${imageData.pageNumber}`);
      
      // Rate limiting: wait 1-2 seconds between calls
      if (imageData.pageNumber < imageUrls.length) {
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
      
    } catch (error) {
      console.error(`Character analysis failed for page ${imageData.pageNumber}:`, error);
      
      results.push({
        pageNumber: imageData.pageNumber,
        characterDescription: '',
        success: false
      });
    }
  }
  
  console.log(`Character analysis completed. ${results.filter(r => r.success).length}/${results.length} pages analyzed successfully`);
  return results;
}

export async function generateCharacterMetaContext(
  characterAnalyses: CharacterAnalysisResult[],
  artStyle: string,
  supabase: any
): Promise<string> {
  console.log('Generating character-only meta-context from analyses');
  
  // Filter successful analyses
  const validAnalyses = characterAnalyses.filter(r => r.success && r.characterDescription.trim());
  
  if (validAnalyses.length === 0) {
    console.log('No valid character analyses available');
    return '';
  }
  
  // Build character consolidation prompt
  const characterSummaryPrompt = `You are analyzing a children's storybook to create a CHARACTER CONSISTENCY GUIDE.

Below are the character descriptions extracted from each page:

${validAnalyses.map(analysis => 
  `PAGE ${analysis.pageNumber}: ${analysis.characterDescription}`
).join('\n\n')}

YOUR TASK:
- Summarize the main characters' visual traits (appearance, clothing, colors, accessories, etc.)
- Ignore background, setting, text style, and layout
- Output a concise character reference for use in all future pages
- Focus on consistent visual elements that must remain the same across all pages

Art style: ${artStyle}

Output only the character summary for consistency reference.`;

  try {
    // Use GPT-4 text-only for character consolidation (cheaper and faster)
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'user', content: characterSummaryPrompt }
        ],
        max_tokens: 800
      }),
    });

    if (!response.ok) {
      throw new Error(`Character meta-context generation failed: ${response.status}`);
    }

    const data = await response.json();
    const characterMetaContext = data.choices[0].message.content;
    
    console.log('Character meta-context generated successfully');
    return characterMetaContext;
    
  } catch (error) {
    console.error('Error generating character meta-context:', error);
    
    // Fallback: use first page analysis if consolidation fails
    if (validAnalyses.length > 0) {
      console.log('Using first page analysis as fallback meta-context');
      return `CHARACTER CONSISTENCY GUIDE (from first page analysis):
${validAnalyses[0].characterDescription}

Art style: ${artStyle}`;
    }
    
    return '';
  }
}
