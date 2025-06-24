
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

Transform this child's hand-drawn story page into a professional children's book illustration with these CRITICAL specifications:

📐 FORMAT REQUIREMENTS - NON-NEGOTIABLE:
- Portrait orientation, 3:4 aspect ratio (1024x1536 pixels)
- Full-page children's book layout with proper margins
- Composition designed for portrait book format

🔤 TEXT REQUIREMENTS - HIGHEST PRIORITY:
- Any text in the image must be EXACTLY readable, letter-perfect, and crystal clear
- Use clean, professional typography: Arial, Helvetica, or similar sans-serif fonts ONLY
- Text must be large enough for children to read easily (equivalent to 18-24pt size)
- Text positioned within safe margins - never cut off at edges
- Text must blend naturally with the illustration while remaining crisp and legible
- High contrast between text and background for maximum readability
- NO decorative fonts, NO handwriting styles, NO text effects that reduce clarity
- NO misspellings - spell every word perfectly in English
- If dialogue exists, use clean speech bubbles with white/light backgrounds
- If narration exists, position it clearly at top or bottom with simple background

🎨 VISUAL STYLE REQUIREMENTS:
- ${stylePrompt}
- Warm, gentle colors suitable for young children (pastels, soft tones)
- Child-friendly and inviting atmosphere
- Professional children's book illustration quality
- High detail but not overwhelming or scary
- Magical and enchanting while staying true to the child's vision

📚 CONTENT ANALYSIS:
Carefully analyze the provided child's drawing to understand:
- Character appearances, clothing, and expressions
- Setting and background elements  
- Any text, dialogue, or narration present
- Story events happening on this page
- Emotional tone and mood

🔄 CONSISTENCY REQUIREMENTS (for pages after page 1):
- If this is not the first page, maintain identical character designs from previous pages
- Keep the same color palette and artistic approach established earlier
- Ensure visual continuity and storytelling flow

✅ FINAL QUALITY CHECK:
- Text must be as readable as in a printed children's book
- Image must fit portrait 3:4 aspect ratio perfectly
- All story elements from original drawing must be preserved
- Professional publishing quality suitable for young readers`;
}
