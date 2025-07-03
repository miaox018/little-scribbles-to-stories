
export async function validateStoryExists(supabase: any, storyId: string) {
  console.log('Fetching story data...');
  const { data: storyData, error: storyError } = await supabase
    .from('stories')
    .select('user_id, status')
    .eq('id', storyId)
    .single();

  if (storyError || !storyData) {
    console.error('Story fetch error:', storyError);
    throw new Error(JSON.stringify({ error: 'Story not found', details: storyError?.message }));
  }

  // Check if story is already cancelled
  if (storyData.status === 'cancelled') {
    console.log('Story is already cancelled, aborting processing');
    return { 
      userId: storyData.user_id, 
      cancelled: true 
    };
  }

  const userId = storyData.user_id;
  console.log('Found story for user:', userId);
  
  return { userId, cancelled: false };
}
