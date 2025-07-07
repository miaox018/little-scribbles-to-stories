
// This file is no longer needed as character meta-context is now generated
// directly in the main processing workflow for better timing and efficiency

export async function generateStoryMetaContext(
  storyId: string,
  artStyle: string,
  supabase: any
): Promise<void> {
  console.log(`Meta-context generation is now handled directly in the main processing workflow for story ${storyId}`);
  // This function is kept for compatibility but is no longer used
  // Character analysis and meta-context generation happens in the main workflow
}
