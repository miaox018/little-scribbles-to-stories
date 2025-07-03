
export async function validateUserAuthentication(req: Request): Promise<{ userId: string; authError?: string }> {
  const authHeader = req.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error(JSON.stringify({ 
      error: 'Missing or invalid authorization header',
      code: 'UNAUTHORIZED'
    }));
  }

  const token = authHeader.replace('Bearer ', '');
  
  // Additional token validation can be added here
  if (!token || token.length < 20) {
    throw new Error(JSON.stringify({ 
      error: 'Invalid authentication token',
      code: 'INVALID_TOKEN'
    }));
  }

  // Extract user ID from the request context (Supabase handles JWT verification)
  const userId = req.headers.get('x-user-id');
  if (!userId) {
    throw new Error(JSON.stringify({ 
      error: 'User ID not found in request context',
      code: 'USER_ID_MISSING'
    }));
  }

  return { userId };
}

export async function validateUserOwnership(supabase: any, userId: string, storyId: string): Promise<boolean> {
  const { data: story, error } = await supabase
    .from('stories')
    .select('user_id')
    .eq('id', storyId)
    .single();

  if (error || !story) {
    throw new Error(JSON.stringify({ 
      error: 'Story not found or access denied',
      code: 'STORY_ACCESS_DENIED'
    }));
  }

  if (story.user_id !== userId) {
    throw new Error(JSON.stringify({ 
      error: 'User does not own this story',
      code: 'OWNERSHIP_VIOLATION'
    }));
  }

  return true;
}
