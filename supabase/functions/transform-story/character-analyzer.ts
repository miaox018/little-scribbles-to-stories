
import { analyzeImageWithGPT } from './openai-api.ts';

interface CharacterAnalysisResult {
  pageNumber: number;
  characterDescription: string;
  textContent: string;
  contentType: 'text-heavy' | 'drawing-heavy' | 'mixed';
  success: boolean;
}

interface ContentClassification {
  contentType: 'text-heavy' | 'drawing-heavy' | 'mixed';
  hasText: boolean;
  hasDrawing: boolean;
  confidence: number;
}

export async function classifyPageContent(
  imageUrl: string
): Promise<ContentClassification> {
  console.log('Classifying page content type...');
  
  const classificationPrompt = `Analyze this children's storybook page and classify it:

CLASSIFICATION TASK:
- Is this page primarily TEXT-HEAVY (lots of readable text, minimal drawings)?
- Is this page primarily DRAWING-HEAVY (detailed drawings/artwork, minimal text)?  
- Is this page MIXED (significant amounts of both text and drawings)?

RESPOND WITH ONLY:
Type: [text-heavy/drawing-heavy/mixed]
Text: [yes/no]
Drawing: [yes/no]
Confidence: [1-10]

Keep response under 50 tokens.`;

  try {
    const response = await analyzeImageWithGPT(imageUrl, classificationPrompt);
    
    // Parse the classification response
    const typeMatch = response.match(/Type:\s*(text-heavy|drawing-heavy|mixed)/i);
    const textMatch = response.match(/Text:\s*(yes|no)/i);
    const drawingMatch = response.match(/Drawing:\s*(yes|no)/i);
    const confidenceMatch = response.match(/Confidence:\s*(\d+)/);
    
    return {
      contentType: (typeMatch?.[1]?.toLowerCase() as any) || 'mixed',
      hasText: textMatch?.[1]?.toLowerCase() === 'yes',
      hasDrawing: drawingMatch?.[1]?.toLowerCase() === 'yes',
      confidence: parseInt(confidenceMatch?.[1] || '5')
    };
  } catch (error) {
    console.error('Content classification failed:', error);
    // Default fallback
    return {
      contentType: 'mixed',
      hasText: true,
      hasDrawing: true,
      confidence: 3
    };
  }
}

export async function analyzeTextHeavyPage(
  imageUrl: string,
  pageNumber: number
): Promise<{ textContent: string; characterInfo: string }> {
  console.log(`Analyzing text-heavy page ${pageNumber} for character clues...`);
  
  const textAnalysisPrompt = `Extract text and analyze for CHARACTER INFORMATION from this children's storybook page:

EXTRACT ALL READABLE TEXT first, then analyze for:
- Character gender clues (he/she/they/his/her pronouns)
- Family relationships (mom, dad, sister, brother, grandma, etc.)
- Character names mentioned
- Age indicators (little, big, baby, older, younger)
- Character descriptions in the text

RESPOND FORMAT:
TEXT: [all readable text from the page]
CHARACTERS: [character details inferred from text - keep under 100 tokens]

Focus on text extraction and character inference. Ignore visual elements.`;

  try {
    const response = await analyzeImageWithGPT(imageUrl, textAnalysisPrompt);
    
    // Parse the response
    const textMatch = response.match(/TEXT:\s*(.*?)(?=CHARACTERS:|$)/s);
    const charactersMatch = response.match(/CHARACTERS:\s*(.*)/s);
    
    return {
      textContent: textMatch?.[1]?.trim() || '',
      characterInfo: charactersMatch?.[1]?.trim() || ''
    };
  } catch (error) {
    console.error(`Text analysis failed for page ${pageNumber}:`, error);
    return {
      textContent: '',
      characterInfo: ''
    };
  }
}

export async function analyzeDrawingHeavyPage(
  imageUrl: string,
  pageNumber: number
): Promise<string> {
  console.log(`Analyzing drawing-heavy page ${pageNumber} for main character...`);
  
  const visualAnalysisPrompt = `Extract ONLY the main character's visual traits from this drawing:

FOCUS ONLY ON:
- Main character appearance (hair color, style, clothing colors)
- Character size/age (child, adult, baby)
- Key distinguishing features
- Gender indicators from appearance

IGNORE:
- Background, setting, objects
- Secondary characters (unless they're family)
- Text or speech bubbles
- Story events or actions

RESPOND with concise character description under 100 tokens.
If no clear main character, describe the most prominent person/character.`;

  try {
    const characterDescription = await analyzeImageWithGPT(imageUrl, visualAnalysisPrompt);
    return characterDescription.trim();
  } catch (error) {
    console.error(`Visual analysis failed for page ${pageNumber}:`, error);
    return '';
  }
}

export async function analyzeCharactersInPages(
  imageUrls: Array<{ storageUrl: string; pageNumber: number }>,
  supabase: any
): Promise<CharacterAnalysisResult[]> {
  console.log(`Starting smart character analysis for ${imageUrls.length} pages`);
  
  const results: CharacterAnalysisResult[] = [];
  
  // Sequential processing with rate limiting
  for (const imageData of imageUrls) {
    try {
      console.log(`Processing page ${imageData.pageNumber}...`);
      
      // Fetch image and convert to data URL
      const response = await fetch(imageData.storageUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      const contentType = response.headers.get('content-type') || 'image/jpeg';
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      const dataUrl = `data:${contentType};base64,${base64}`;
      
      // Step 1: Classify content type
      const classification = await classifyPageContent(dataUrl);
      console.log(`Page ${imageData.pageNumber} classified as: ${classification.contentType}`);
      
      let characterDescription = '';
      let textContent = '';
      
      // Step 2: Adaptive analysis based on content type
      if (classification.contentType === 'text-heavy') {
        const textAnalysis = await analyzeTextHeavyPage(dataUrl, imageData.pageNumber);
        textContent = textAnalysis.textContent;
        characterDescription = textAnalysis.characterInfo;
      } else if (classification.contentType === 'drawing-heavy') {
        characterDescription = await analyzeDrawingHeavyPage(dataUrl, imageData.pageNumber);
      } else {
        // Mixed content: do both but with shorter prompts
        const [textAnalysis, visualDescription] = await Promise.all([
          analyzeTextHeavyPage(dataUrl, imageData.pageNumber),
          analyzeDrawingHeavyPage(dataUrl, imageData.pageNumber)
        ]);
        
        textContent = textAnalysis.textContent;
        characterDescription = `${textAnalysis.characterInfo} ${visualDescription}`.trim();
      }
      
      results.push({
        pageNumber: imageData.pageNumber,
        characterDescription,
        textContent,
        contentType: classification.contentType,
        success: true
      });
      
      console.log(`Page ${imageData.pageNumber} analysis completed`);
      
      // Rate limiting: wait 1-2 seconds between calls
      if (imageData.pageNumber < imageUrls.length) {
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
      
    } catch (error) {
      console.error(`Character analysis failed for page ${imageData.pageNumber}:`, error);
      
      results.push({
        pageNumber: imageData.pageNumber,
        characterDescription: '',
        textContent: '',
        contentType: 'mixed',
        success: false
      });
    }
  }
  
  console.log(`Smart character analysis completed. ${results.filter(r => r.success).length}/${results.length} pages analyzed successfully`);
  return results;
}

export async function generateCharacterMetaContext(
  characterAnalyses: CharacterAnalysisResult[],
  artStyle: string,
  supabase: any
): Promise<string> {
  console.log('Generating optimized character meta-context from smart analyses');
  
  // Filter successful analyses
  const validAnalyses = characterAnalyses.filter(r => r.success && (r.characterDescription.trim() || r.textContent.trim()));
  
  if (validAnalyses.length === 0) {
    console.log('No valid character analyses available, using fallback template');
    return generateFallbackCharacterTemplate(artStyle);
  }
  
  // Prepare consolidated data for meta-context generation
  const textClues = validAnalyses
    .filter(a => a.textContent.trim())
    .map(a => `Page ${a.pageNumber}: ${a.textContent.substring(0, 200)}`)
    .join('\n');
    
  const characterClues = validAnalyses
    .filter(a => a.characterDescription.trim())
    .map(a => `Page ${a.pageNumber}: ${a.characterDescription}`)
    .join('\n');
  
  // Build efficient consolidation prompt
  const consolidationPrompt = `Create a CONCISE character consistency guide for a children's storybook.

TEXT CLUES FROM STORY:
${textClues}

CHARACTER DESCRIPTIONS:
${characterClues}

TASK: Generate a focused character reference (max 200 tokens) including:
- Main character basics (age, gender, key appearance)
- Family members mentioned (if any)
- Consistent visual elements for ${artStyle} art style

OUTPUT FORMAT:
MAIN CHARACTER: [age, gender, key features]
APPEARANCE: [hair, clothing, colors, distinguishing traits]
FAMILY: [other characters mentioned]
STYLE NOTES: [${artStyle} specific guidance]

Keep extremely concise - focus only on elements needed for visual consistency.`;

  try {
    // Use GPT-4o text-only for efficient consolidation
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'user', content: consolidationPrompt }
        ],
        max_tokens: 300 // Strict token limit
      }),
    });

    if (!response.ok) {
      throw new Error(`Character meta-context generation failed: ${response.status}`);
    }

    const data = await response.json();
    const characterMetaContext = data.choices[0].message.content;
    
    console.log('Optimized character meta-context generated successfully');
    return characterMetaContext;
    
  } catch (error) {
    console.error('Error generating character meta-context:', error);
    
    // Enhanced fallback: use best available analysis
    if (validAnalyses.length > 0) {
      console.log('Using enhanced fallback meta-context');
      const bestAnalysis = validAnalyses[0];
      return `CHARACTER CONSISTENCY GUIDE:
MAIN CHARACTER: Child protagonist (age 6-10)
APPEARANCE: ${bestAnalysis.characterDescription}
TEXT CONTEXT: ${bestAnalysis.textContent.substring(0, 100)}
ART STYLE: ${artStyle}

Maintain consistent character appearance across all pages.`;
    }
    
    return generateFallbackCharacterTemplate(artStyle);
  }
}

function generateFallbackCharacterTemplate(artStyle: string): string {
  console.log('Generating fallback character template');
  
  return `CHARACTER CONSISTENCY GUIDE (Default Template):
MAIN CHARACTER: Child protagonist, age 6-10, friendly appearance
APPEARANCE: Simple, age-appropriate clothing, expressive features
FAMILY: May include parents, siblings as story context suggests
ART STYLE: ${artStyle} - maintain consistent character design
COLORS: Use warm, child-friendly color palette
FEATURES: Keep character recognizable with consistent hair, clothing, size

Apply these defaults when specific character details are not available.`;
}
