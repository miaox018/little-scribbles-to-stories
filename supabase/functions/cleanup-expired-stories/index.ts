import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CleanupResult {
  deleted_story_id: string;
  deleted_pages_count: number;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🧹 Starting cleanup of expired stories...');

    // Initialize Supabase client with service role key for admin operations
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Call the cleanup function
    const { data: cleanupResults, error: cleanupError } = await supabase
      .rpc('cleanup_expired_stories') as { data: CleanupResult[] | null, error: any };

    if (cleanupError) {
      console.error('❌ Error during cleanup:', cleanupError);
      throw cleanupError;
    }

    const deletedCount = cleanupResults?.length || 0;
    console.log(`✅ Cleanup completed. ${deletedCount} expired stories deleted.`);

    // If stories were deleted, also clean up their storage images
    if (cleanupResults && cleanupResults.length > 0) {
      console.log('🗑️ Cleaning up storage images for deleted stories...');
      
      for (const result of cleanupResults) {
        try {
          // Delete all images in the story folder from storage
          const { data: files, error: listError } = await supabase.storage
            .from('story-images')
            .list(`stories/${result.deleted_story_id}`);

          if (listError) {
            console.error(`❌ Error listing files for story ${result.deleted_story_id}:`, listError);
            continue;
          }

          if (files && files.length > 0) {
            const filePaths = files.map(file => `stories/${result.deleted_story_id}/${file.name}`);
            
            const { error: deleteError } = await supabase.storage
              .from('story-images')
              .remove(filePaths);

            if (deleteError) {
              console.error(`❌ Error deleting files for story ${result.deleted_story_id}:`, deleteError);
            } else {
              console.log(`✅ Deleted ${files.length} images for story ${result.deleted_story_id}`);
            }
          }
        } catch (error) {
          console.error(`❌ Unexpected error cleaning up storage for story ${result.deleted_story_id}:`, error);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        deletedStoriesCount: deletedCount,
        cleanupResults: cleanupResults,
        message: `Successfully cleaned up ${deletedCount} expired stories and their associated images.`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('❌ Cleanup function error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        message: 'Failed to cleanup expired stories'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});