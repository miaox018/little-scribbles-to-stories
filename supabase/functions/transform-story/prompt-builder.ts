export function buildPrompt(
  pageNumber: number, 
  stylePrompt: string, 
  characterDescriptions?: string, 
  artStyleGuidelines?: string
): string {
  
  const characterConsistencySection = pageNumber > 1 && characterDescriptions ? `

CHARACTER CONSISTENCY: Maintain exact character designs from previous pages:
${characterDescriptions}
- Same hair, clothing, facial features, and colors
- Perfect visual continuity required
` : '';

  const characterEstablishmentSection = pageNumber === 1 ? `

CHARACTER ESTABLISHMENT: Create clear, consistent character designs with distinctive features for future pages.
` : '';

  return `Transform this child's drawing into a professional children's book illustration.

🔍 TEXT PRESERVATION (TARGET: 60%+ of child's text):
- Examine image carefully for ALL handwritten text, dialogue
- Preserve child's exact spelling (even if misspelled)  
- Keep text placement and speech bubbles as drawn
- Make text clearly readable with professional typography
- If unclear, interpret best; if unreadable, omit

🎨 ENHANCEMENT RULES:
- Upgrade to ${stylePrompt || 'professional watercolor style'}
- Keep child's composition, characters, and story elements intact
- Improve line quality, colors, and add rich background details
- Portrait orientation (1024x1536), child-appropriate content

${characterEstablishmentSection}${characterConsistencySection}

Transform into a polished storybook page while preserving the child's creativity and at least 60% of their written text.`;
}
