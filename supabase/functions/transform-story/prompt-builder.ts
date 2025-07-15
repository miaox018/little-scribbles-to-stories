export function buildTransformationPrompt(
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

  return `Transform this child's hand-drawn story page into a professional children's book illustration while preserving their exact creative vision.

TRANSFORMATION INSTRUCTIONS:
✨ PRESERVE THE ORIGINAL COMPOSITION:
- Keep all characters in their exact positions and poses
- Maintain the same scene layout and spatial relationships
- Preserve any text, dialogue, or written elements exactly as drawn
- Honor the child's intended story elements and emotions
- Keep the same perspective and viewpoint

🎨 PROFESSIONAL ENHANCEMENT:
- Upgrade to ${stylePrompt || 'professional watercolor children\'s book illustration style'}
- Improve line quality, proportions, and artistic techniques while keeping the same poses
- Add rich background details that complement the existing scene
- Enhance colors while maintaining the child's intended color choices
- Polish the overall composition for professional book layout

📝 TEXT PRESERVATION:
- Keep any text the child wrote exactly as they intended
- Make all text perfectly readable with child-friendly typography
- Use clean fonts and ensure high contrast with background
- Format dialogue in clear speech bubbles if present in original

${characterEstablishmentSection}${characterConsistencySection}

🔧 TECHNICAL SPECIFICATIONS:
- Maintain portrait orientation suitable for children's book pages
- Professional illustration quality with proper margins
- Child-appropriate content (ages 3-8)
- Warm, engaging atmosphere that invites reading
- Preserve important elements in their original positions

🎯 TRANSFORMATION GOAL:
Edit this drawing to become a beautiful, professional children's book illustration that:
- Keeps the exact same story content and character positions
- Enhances the artistic quality without changing the child's vision
- Maintains character consistency for story continuity
- Meets professional children's book publishing standards
- Preserves the authentic spirit of the child's creativity

Transform the child's drawing into a polished storybook page while keeping their original ideas completely intact.`;
}

// Keep the original buildPrompt function for backward compatibility
export function buildPrompt(
  pageNumber: number, 
  stylePrompt: string, 
  characterDescriptions?: string, 
  artStyleGuidelines?: string
): string {
  return buildTransformationPrompt(pageNumber, stylePrompt, characterDescriptions, artStyleGuidelines);
}
