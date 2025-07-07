
import { analyzeImageWithGPT } from './openai-api.ts';

export async function generateMetaContext(
  storyId: string,
  enhancedPrompts: string[],
  artStyle: string,
  supabase: any
): Promise<string> {
  console.log(`Generating meta-context for story ${storyId} from ${enhancedPrompts.length} page analyses`);
  
  // Build the meta-context generation prompt
  const metaContextPrompt = `
You are analyzing a complete children's story book to create a comprehensive character and world consistency guide.

STORY CONTEXT:
Art Style: ${artStyle}
Total Pages Analyzed: ${enhancedPrompts.length}

INDIVIDUAL PAGE ANALYSES:
${enhancedPrompts.map((prompt, index) => `
PAGE ${index + 1} ANALYSIS:
${prompt}
---`).join('\n')}

YOUR TASK:
Create a detailed character and world consistency summary that will be used for generating ALL future pages in this story. Focus on:

CHARACTER DESCRIPTIONS:
- Physical appearance (height, build, hair, eyes, clothing style, colors)
- Unique visual characteristics and accessories
- Age and personality traits that affect appearance
- Consistent names and relationships

WORLD BUILDING:
- Setting descriptions (locations, environments, time period)
- Art style specifics and color palette
- Recurring objects, props, and background elements
- Architectural style and environmental details

TEXT STYLE:
- Typography preferences and text placement
- Speech bubble or text box styles
- Font choices and sizing

CONSISTENCY RULES:
- Must maintain exact same character appearances across all pages
- Should preserve established visual language and composition style
- Keep the same magical/realistic tone established in early pages

FORMAT your response as a clear, detailed reference guide that an artist could use to maintain perfect consistency across all story pages. Be specific about visual details that matter for character recognition.
`;

  try {
    // Generate meta-context using GPT-4
    const metaContext = await analyzeImageWithGPT('', metaContextPrompt);
    
    // Store the meta-context in the stories table
    await supabase
      .from('stories')
      .update({
        character_summary: metaContext,
        meta_context_version: 2, // Increment version to indicate new meta-context
        updated_at: new Date().toISOString()
      })
      .eq('id', storyId);

    console.log(`Meta-context generated and stored for story ${storyId}`);
    return metaContext;
  } catch (error) {
    console.error(`Error generating meta-context for story ${storyId}:`, error);
    throw error;
  }
}

export async function getOrGenerateMetaContext(
  storyId: string,
  supabase: any
): Promise<string> {
  try {
    // First, try to get existing meta-context
    const { data: story } = await supabase
      .from('stories')
      .select('character_summary, art_style')
      .eq('id', storyId)
      .single();

    if (story?.character_summary) {
      console.log(`Using cached meta-context for story ${storyId}`);
      return story.character_summary;
    }

    // If no meta-context exists, generate it from existing page analyses
    const { data: pages } = await supabase
      .from('story_pages')
      .select('enhanced_prompt')
      .eq('story_id', storyId)
      .not('enhanced_prompt', 'is', null)
      .order('page_number');

    if (pages && pages.length > 0) {
      const enhancedPrompts = pages
        .map(page => page.enhanced_prompt)
        .filter(prompt => prompt && prompt.trim().length > 0);

      if (enhancedPrompts.length > 0) {
        console.log(`Generating meta-context from ${enhancedPrompts.length} existing analyses`);
        return await generateMetaContext(storyId, enhancedPrompts, story?.art_style || 'classic_watercolor', supabase);
      }
    }

    console.log(`No existing analyses found for story ${storyId}, will generate meta-context after page processing`);
    return '';
  } catch (error) {
    console.error(`Error getting/generating meta-context for story ${storyId}:`, error);
    return '';
  }
}
