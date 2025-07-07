
import { generateMetaContext } from './meta-context-generator.ts';

export async function generateStoryMetaContext(
  storyId: string,
  artStyle: string,
  supabase: any
): Promise<void> {
  console.log(`Starting meta-context generation for completed story ${storyId}`);

  try {
    // Get all completed page analyses
    const { data: pages } = await supabase
      .from('story_pages')
      .select('enhanced_prompt, page_number')
      .eq('story_id', storyId)
      .eq('transformation_status', 'completed')
      .not('enhanced_prompt', 'is', null)
      .order('page_number');

    if (!pages || pages.length === 0) {
      console.log(`No completed pages found for story ${storyId}, skipping meta-context generation`);
      return;
    }

    const enhancedPrompts = pages
      .map(page => page.enhanced_prompt)
      .filter(prompt => prompt && prompt.trim().length > 0);

    if (enhancedPrompts.length === 0) {
      console.log(`No valid enhanced prompts found for story ${storyId}`);
      return;
    }

    // Generate and store meta-context
    await generateMetaContext(storyId, enhancedPrompts, artStyle, supabase);
    
    console.log(`Meta-context generation completed for story ${storyId} using ${enhancedPrompts.length} page analyses`);
  } catch (error) {
    console.error(`Error generating meta-context for story ${storyId}:`, error);
    // Don't throw error - meta-context generation failure shouldn't fail the whole story
  }
}
