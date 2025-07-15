
export function buildPrompt(
  pageNumber: number, 
  stylePrompt: string, 
  characterDescriptions?: string, 
  artStyleGuidelines?: string
): string {
  
  const characterConsistencySection = pageNumber > 1 && characterDescriptions ? `

CHARACTER CONSISTENCY REQUIREMENTS:
Maintain these exact character designs from previous pages:
${characterDescriptions}

CRITICAL: All characters must appear IDENTICAL to their established designs:
- Same hair color, style, and length
- Same clothing colors, patterns, and styles  
- Same facial features and expressions
- Same body proportions and posture
- Same color palette and artistic treatment

DO NOT alter character appearances - maintain perfect visual continuity.
` : '';

  const characterEstablishmentSection = pageNumber === 1 ? `

CHARACTER DESIGN ESTABLISHMENT (First Page):
As this is the first page, establish clear, consistent character designs:
- Create memorable, distinct characters with unique appearances
- Use specific colors and clothing styles that can be replicated
- Design characters that are easily recognizable and age-appropriate
- Ensure each character has distinctive features for future consistency
` : '';

  return `Transform this child's hand-drawn story page into a professional children's book illustration while preserving their creative vision and storytelling.

PRESERVATION PRIORITIES:
✨ HONOR THE CHILD'S VISION:
- Keep all characters exactly as the child conceived them
- Preserve the story elements, actions, and emotions from their drawing
- Maintain any text, dialogue, or written elements they included
- Respect the scene composition and character relationships
- Honor the mood and atmosphere they were trying to create

🎨 PROFESSIONAL ENHANCEMENT:
- Upgrade to ${stylePrompt || 'professional watercolor children\'s book illustration style'}
- Improve line quality, proportions, and artistic techniques
- Add rich background details and appropriate textures
- Enhance colors while maintaining the child's intended palette
- Polish the overall composition for professional book layout

📝 TEXT AND DIALOGUE:
- Preserve any text the child wrote (dialogue, narration, labels)
- Make all text perfectly readable with child-friendly typography
- Use clean fonts (Arial, Helvetica, or Times New Roman)
- Ensure high contrast between text and background
- Format dialogue in clear speech bubbles if appropriate

${characterEstablishmentSection}${characterConsistencySection}

🔧 TECHNICAL SPECIFICATIONS:
- Portrait orientation (1024x1536 pixels) suitable for children's book
- Professional illustration quality with proper margins for book layout
- Child-appropriate content (ages 3-8)
- Warm, engaging atmosphere that invites reading
- Safe composition with important elements centered
- Leave adequate space for potential text overlay

🎯 FINAL RESULT:
Create a beautiful, professional children's book illustration that:
- Makes the child's story come alive with enhanced visual appeal
- Maintains the authentic spirit and creativity of their original drawing
- Provides consistent character designs for story continuity
- Meets professional children's book publishing standards
- Captures the magic and wonder that children see in their own stories

Transform this child's creative vision into a stunning storybook page that they and their family will treasure forever.`;
}