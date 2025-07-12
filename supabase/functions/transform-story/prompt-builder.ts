
export function buildPrompt(
  pageNumber: number, 
  stylePrompt: string, 
  characterDescriptions: string, 
  artStyleGuidelines: string,
  metaContext?: string
): string {
  let contextPrompt = "";
  
  if (metaContext) {
    // Use character-only meta-context for enhanced consistency
    contextPrompt = `This is PAGE ${pageNumber} of a children's story book. MAINTAIN PERFECT CHARACTER CONSISTENCY:

${metaContext}

CRITICAL: Follow the above character descriptions EXACTLY to ensure visual consistency across all pages.

Use the following art style: ${stylePrompt}`;
  } else if (pageNumber === 1) {
    // First page without meta-context (initial generation)
    contextPrompt = `This is PAGE 1 of a children's story book. ESTABLISH the character designs and art style that will be consistent throughout all pages. Use the following art style: ${stylePrompt}`;
  } else {
    // Fallback to original approach
    contextPrompt = `This is PAGE ${pageNumber} of the same children's story book. MAINTAIN CONSISTENCY with the established:
${characterDescriptions}
${artStyleGuidelines}

Use the following art style: ${stylePrompt}

Previous pages in this story have been generated with these visual elements. Ensure the same characters, art style, and story world continue seamlessly.`;
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
