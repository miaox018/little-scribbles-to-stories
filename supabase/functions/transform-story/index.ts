
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { processStory } from "./story-processor.ts";
import { StoryProcessingError, ImageData, StoryProcessingRequest } from "./types.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? ''
  );

  const supabaseServiceClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header provided');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user) throw new Error('User not authenticated');

    const { storyId, images, artStyle }: StoryProcessingRequest = await req.json();

    console.log(`[TRANSFORM] Starting story transformation for story ${storyId} with ${images.length} images`);

    // Update story status to processing immediately
    await supabaseServiceClient
      .from('stories')
      .update({ 
        status: 'processing',
        updated_at: new Date().toISOString()
      })
      .eq('id', storyId);

    // Return immediately to prevent timeout, then process in background
    const response = new Response(JSON.stringify({ 
      success: true, 
      message: 'Story processing started',
      storyId 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

    // Process the story in the background (don't await)
    processStoryInBackground(storyId, images, artStyle, user.id, supabaseServiceClient)
      .catch(error => {
        console.error('[TRANSFORM] Background processing failed:', error);
        // Update story status to failed
        supabaseServiceClient
          .from('stories')
          .update({ 
            status: 'failed',
            updated_at: new Date().toISOString()
          })
          .eq('id', storyId)
          .then(() => console.log('[TRANSFORM] Story status updated to failed'))
          .catch(updateError => console.error('[TRANSFORM] Failed to update story status:', updateError));
      });

    return response;

  } catch (error) {
    console.error('[TRANSFORM] Error in transform function:', error);
    
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

async function processStoryInBackground(
  storyId: string, 
  images: ImageData[], 
  artStyle: string, 
  userId: string,
  supabaseServiceClient: any
) {
  try {
    console.log(`[TRANSFORM] Background processing started for story ${storyId}`);
    
    const result = await processStory(storyId, images, artStyle, userId, supabaseServiceClient);
    
    // Update story status based on result
    const finalStatus = result.failed > 0 ? 
      (result.successful > 0 ? 'partial' : 'failed') : 'completed';
    
    await supabaseServiceClient
      .from('stories')
      .update({ 
        status: finalStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', storyId);

    console.log(`[TRANSFORM] Background processing completed for story ${storyId}. Status: ${finalStatus}`);
    
  } catch (error) {
    console.error(`[TRANSFORM] Background processing failed for story ${storyId}:`, error);
    throw error;
  }
}
