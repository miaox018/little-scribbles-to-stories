
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from './config.ts';
import { handleCorsRequest, validateRequest, validateRequestBody } from './request-handler.ts';
import { validateStoryExists } from './story-validation.ts';
import { processSynchronously } from './sync-processor.ts';
import { startAsyncProcessing } from './async-processor.ts';
import { validateUserAuthentication, validateUserOwnership } from './auth-validation.ts';
import { validateStoryId, validateImageUrls, validateArtStyle, validateRequestSize } from './input-validation.ts';

// Add shutdown handling
addEventListener('beforeunload', (ev) => {
  console.log('=== Edge Function Shutdown ===');
  console.log('Shutdown reason:', ev.detail?.reason);
  console.log('Function instance is shutting down. Background tasks should continue via EdgeRuntime.waitUntil()');
});

serve(async (req) => {
  console.log('=== ENHANCED EDGE FUNCTION START ===');
  console.log('Request URL:', req.url);
  console.log('Request method:', req.method);
  console.log('Timestamp:', new Date().toISOString());
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return handleCorsRequest();
  }

  try {
    // Validate authentication and get authenticated Supabase client
    const { userId, supabase } = await validateUserAuthentication(req);
    console.log('Authenticated user:', userId);
    
    // Validate and parse request with enhanced security
    const { requestBody, bodyText } = await validateRequest(req);
    
    // Validate request size
    validateRequestSize(bodyText);
    
    // Enhanced input validation
    const storyId = validateStoryId(requestBody.storyId);
    const artStyle = validateArtStyle(requestBody.artStyle);
    validateImageUrls(requestBody.imageUrls);
    
    // Validate user ownership of the story
    await validateUserOwnership(supabase, userId, storyId);
    
    // Validate story exists and get user info
    const { userId: storyUserId, cancelled } = await validateStoryExists(supabase, storyId);
    
    // Double-check user ownership
    if (storyUserId !== userId) {
      throw new Error(JSON.stringify({ 
        error: 'User does not own this story',
        code: 'OWNERSHIP_VIOLATION'
      }));
    }
    
    if (cancelled) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Story processing was cancelled before it could start' 
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // ENHANCED HYBRID PROCESSING LOGIC
    const SYNC_THRESHOLD = 3;
    let result;

    if (requestBody.imageUrls.length <= SYNC_THRESHOLD) {
      console.log(`[PROCESSING] Using synchronous mode for ${requestBody.imageUrls.length} pages`);
      result = await processSynchronously(storyId, requestBody.imageUrls, artStyle, userId, supabase);
      if (result.cancelled) {
        return new Response(
          JSON.stringify({ success: false, message: result.message }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      console.log(`[PROCESSING] Using queued background mode for ${requestBody.imageUrls.length} pages`);

      // Build 1-based page inputs with storageUrl for each page
      const pageInputs = requestBody.imageUrls.map((img: any, idx: number) => ({
        page_number: idx + 1,
        storageUrl: img.storageUrl,
      }));

      // Invoke enqueue-story with service role to set up jobs and kick the worker
      const enqueueResp = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/enqueue-story`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ storyId, pageInputs }),
      });

      if (!enqueueResp.ok) {
        const txt = await enqueueResp.text();
        throw new Error(JSON.stringify({ error: `Enqueue failed: ${txt}` }));
      }

      // Update story state immediately
      await supabase
        .from('stories')
        .update({ status: 'processing', description: `Queued ${pageInputs.length} pages`, updated_at: new Date().toISOString() })
        .eq('id', storyId);

      result = {
        success: true,
        message: `Queued ${pageInputs.length} pages for background processing`,
        status: 'processing',
        processing_mode: 'queued',
      };
    }

    console.log('=== EDGE FUNCTION SUCCESS ===');
    console.log('Result:', result);

    return new Response(
      JSON.stringify(result),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('=== EDGE FUNCTION ERROR ===');
    console.error('Error in transform-story function:', error);
    console.error('Error stack:', error.stack);
    console.error('Timestamp:', new Date().toISOString());
    
    // Try to parse error message if it's JSON
    let errorResponse;
    try {
      errorResponse = JSON.parse(error.message);
    } catch {
      errorResponse = { 
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString()
      };
    }
    
    // Don't expose sensitive error details in production
    const statusCode = errorResponse.code === 'UNAUTHORIZED' || errorResponse.code === 'INVALID_TOKEN' ? 401 :
                      errorResponse.code === 'OWNERSHIP_VIOLATION' || errorResponse.code === 'STORY_ACCESS_DENIED' ? 403 :
                      errorResponse.error?.includes('Empty request body') || errorResponse.error?.includes('Invalid JSON') ? 400 : 500;
    
    return new Response(
      JSON.stringify(errorResponse),
      { 
        status: statusCode,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
