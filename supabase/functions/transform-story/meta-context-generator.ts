// This file is being replaced by the new character-analyzer.ts
// Keeping minimal functionality for backward compatibility

export async function getOrGenerateMetaContext(
  storyId: string,
  supabase: any
): Promise<string> {
  try {
    // Try to get existing character summary
    const { data: story } = await supabase
      .from('stories')
      .select('character_summary')
      .eq('id', storyId)
      .single();

    if (story?.character_summary) {
      console.log(`Using cached character summary for story ${storyId}`);
      return story.character_summary;
    }

    console.log(`No character summary found for story ${storyId}`);
    return '';
  } catch (error) {
    console.error(`Error getting character summary for story ${storyId}:`, error);
    return '';
  }
}

// Legacy functions kept for compatibility
export async function generateMetaContext(
  storyId: string,
  enhancedPrompts: string[],
  artStyle: string,
  supabase: any
): Promise<string> {
  console.log(`Legacy meta-context generation called for story ${storyId} - this should now be handled by character-analyzer.ts`);
  return '';
}
