
export function buildMasterAnalysisPrompt(stylePrompt: string, totalPages: number): string {
  return `You are analyzing ALL ${totalPages} pages of a children's story book to create a MASTER STORY BIBLE that will ensure perfect continuity across all illustrations.

🎯 MASTER ANALYSIS TASK:
Analyze all ${totalPages} images together to create a comprehensive guide that includes:

📖 STORY OVERVIEW:
- What is the main story/adventure happening?
- Who are the main characters and what are their key traits?
- What is the sequence of events across all pages?

👥 CHARACTER BIBLE:
For each character, provide detailed descriptions:
- Physical appearance (hair color, clothing, distinctive features)
- Age and size relative to other characters
- Personality traits that should show in their expressions
- Any props or accessories they consistently have

🎨 VISUAL CONSISTENCY GUIDE:
- Art style: ${stylePrompt}
- Color palette that should be consistent
- Setting/environment details
- Mood and atmosphere of the story
- Any recurring visual elements

📝 TEXT ELEMENTS:
- Any dialogue or narration that appears
- Key text that should be preserved exactly

🔄 STORY FLOW:
- How each page connects to create the complete narrative
- Key emotional beats and character development
- Visual storytelling elements that tie pages together

This master guide will be used to generate ALL illustrations with perfect continuity. Be extremely detailed about character appearances and story elements so every page maintains consistency.

Format your response as a comprehensive story bible that covers all these elements clearly and thoroughly.`;
}

export function buildPagePrompt(pageNumber: number, stylePrompt: string, masterContext: any): string {
  return `Transform this child's hand-drawn story page into a professional children's book illustration using the MASTER STORY CONTEXT below.

📚 MASTER STORY CONTEXT (USE THIS FOR CONSISTENCY):
${masterContext.characterDescriptions}

This is PAGE ${pageNumber} of the story. Use the master context above to ensure:
- Characters look EXACTLY as described in the master context
- Art style matches the established visual language
- Story elements connect properly with the overall narrative

🎨 FORMAT & LAYOUT REQUIREMENTS - HIGHEST PRIORITY:
- Create a PORTRAIT orientation illustration with 3:4 aspect ratio (1024x1536 pixels)
- Design for children's book page layout with proper margins
- Keep ALL main illustration elements within a SAFE MARGIN area, leaving clear space near all edges
- Reserve top and bottom margins for potential text placement
- Ensure the composition works well in portrait format
- Center the main action/characters in the middle area of the page

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
- Specific events happening on this page
- Character expressions and actions for this scene
- Any text, dialogue, or narration present
- How this page fits into the overall story from the master context

STYLE REQUIREMENTS:
- ${stylePrompt}
- Match the visual consistency established in the master context
- Child-appropriate and friendly tone
- High detail but not scary or overwhelming
- Professional children's book illustration quality
- Optimize composition for portrait 3:4 aspect ratio

FINAL CHECK: The text in the final image must be as clear and readable as text in a printed children's book. The illustration must maintain perfect character and story consistency with the master context while capturing the specific events of this individual page.`;
}
