
export function buildPrompt(
  pageNumber: number, 
  stylePrompt: string, 
  characterDescriptions?: string, 
  artStyleGuidelines?: string
): string {
  
  const characterConsistencySection = pageNumber > 1 && characterDescriptions ? `
ESTABLISHED CHARACTER DESIGNS (MUST MAINTAIN):
${characterDescriptions}

CONSISTENCY REQUIREMENT: All characters must appear EXACTLY as described above. Use the same hair, clothing, colors, and features.
` : '';

  const characterEstablishmentSection = pageNumber === 1 ? `
CHARACTER ESTABLISHMENT (First Page):
When analyzing characters, provide detailed descriptions including:
- Character names (if written or implied)
- Physical appearance: hair color/style, facial features, approximate age
- Clothing: specific colors, patterns, and styles
- Personality traits visible through posture/expression
- Distinct color palette for each character
These descriptions will ensure consistency across all story pages.
` : '';

  return `You are a professional children's book development specialist. Analyze this child's story page input and create a detailed image generation prompt for GPT-Image-1.

${characterEstablishmentSection}${characterConsistencySection}

ANALYSIS METHODOLOGY:

🎨 VISUAL ELEMENT EXTRACTION:
- Identify all drawn characters: names, appearances, clothing, expressions, poses
- Describe the setting: indoor/outdoor, time of day, background elements
- Note the action: what is happening in the scene, character interactions
- Observe artistic style: colors used, drawing techniques, overall mood
- Document spatial relationships: character positions, scene composition

📝 TEXT ELEMENT EXTRACTION:
- Read all written words: dialogue, narration, character names, story text
- Identify spoken dialogue vs narrative text vs labels/names
- Extract plot information: events, conflicts, emotions, story progression
- Note character information revealed through text
- Understand temporal context: "then," "next," "suddenly," etc.

🔄 INTEGRATION AND ENHANCEMENT:
- Combine visual character designs with textual character information
- Use text to clarify unclear drawing elements
- Use drawings to visualize abstract text descriptions
- Resolve any conflicts between text and visual elements
- Fill gaps with appropriate story-consistent details

OUTPUT REQUIREMENT:
Generate a detailed, professional image generation prompt for GPT-Image-1 that includes:

1. SCENE DESCRIPTION: Clear description of the setting and environment
2. CHARACTER DETAILS: Specific appearance for each character (use established designs if available)
3. ACTION/POSE: What each character is doing, their expressions and body language
4. DIALOGUE/TEXT: Any text that should appear in the image (speech bubbles, signs, etc.)
5. ARTISTIC STYLE: ${stylePrompt || 'Professional watercolor children\'s book illustration'}
6. TECHNICAL SPECS: Portrait orientation (1024x1536), children's book layout with margins

PROMPT FORMAT EXAMPLE:
"Professional watercolor children's book illustration. [Detailed scene with specific character descriptions, actions, and setting]. Include readable text: '[any dialogue or text]'. Portrait orientation, soft pastel colors, warm and engaging atmosphere suitable for children aged 3-8."

CRITICAL REQUIREMENTS:
- Extract and preserve ALL elements from the child's input (both visual and textual)
- Maintain story continuity and character consistency
- Create child-appropriate, engaging content
- Ensure any text in the final image will be clearly readable
- Balance the child's creative vision with professional illustration standards

Begin your analysis now, extracting all visual and textual elements, then provide the GPT-Image-1 generation prompt.`;
}

// 新增：GPT-Image-1 Only 方案的提示词构建函数
export function buildGPTImage1OnlyPrompt(
  pageNumber: number,
  stylePrompt: string,
  characterDescriptions?: string
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

  const basePrompt = `Transform this child's hand-drawn story page into a professional children's book illustration while preserving their creative vision and storytelling.

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

  return basePrompt;
}

// 新增：GPT-Image-1角色描述提取函数
export function extractCharacterDescriptionsFromImage(imagePage: any): string {
  // 这个函数用于从生成的图像中提取角色描述信息
  // 在实际实现中，可能需要结合生成结果和原始输入来推断角色特征
  
  // 临时实现：返回通用角色描述格式
  return `Character descriptions extracted from page ${imagePage.pageNumber}:
- Character appearances and clothing as established in this illustration
- Color palette and artistic style as shown
- Proportions and design elements for consistency in subsequent pages`;
}

// 新增：验证GPT-Image-1结果的函数
export function validateGPTImage1Result(result: any): {
  isValid: boolean;
  reason?: string;
} {
  if (!result || !result.data || !result.data[0]) {
    return {
      isValid: false,
      reason: 'No image data received from GPT-Image-1'
    };
  }

  if (!result.data[0].b64_json) {
    return {
      isValid: false,
      reason: 'No base64 image data in GPT-Image-1 response'
    };
  }

  // 可以添加更多验证逻辑，比如检查图像尺寸等
  return {
    isValid: true
  };
}