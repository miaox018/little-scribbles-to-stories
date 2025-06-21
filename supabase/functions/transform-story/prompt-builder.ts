
export function buildPrompt(pageNumber: number, stylePrompt: string, characterDescriptions: string, artStyleGuidelines: string): string {
  let contextPrompt = "";
  if (pageNumber === 1) {
    contextPrompt = `This is PAGE 1 of a children's story book. ESTABLISH the character designs, art style, and story world that will be consistent throughout all pages. Use the following art style: ${stylePrompt}`;
  } else {
    contextPrompt = `This is PAGE ${pageNumber} of the same children's story book. MAINTAIN CONSISTENCY with the established:
${characterDescriptions}
${artStyleGuidelines}

Use the following art style: ${stylePrompt}

Previous pages in this story have been generated with these visual elements. Ensure the same characters, art style, and story world continue seamlessly.`;
  }

  return `${contextPrompt}

Transform this child's hand-drawn story page into a professional children's book illustration.

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

CONSISTENCY REQUIREMENTS (for pages after page 1):
- If this is not the first page, maintain the same character designs, art style, and visual language established in previous pages
- Keep the same color palette and artistic approach
- Ensure characters look identical to how they appeared before

FINAL CHECK: The text in the final image must be as clear and readable as text in a printed children's book. If any text appears blurry, distorted, or unclear, the image fails the quality standard.`;
}
