
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from './config.ts';
import { handleCorsRequest, validateRequest, validateRequestBody } from './request-handler.ts';
import { validateStoryExists } from './story-validation.ts';
import { processSynchronously } from './sync-processor.ts';
import { startAsyncProcessing } from './async-processor.ts';
import { validateUserAuthentication, validateUserOwnership } from './auth-validation.ts';
import { validateStoryId, validateImageUrls, validateArtStyle, validateRequestSize } from './input-validation.ts';
import { healthCheck } from './openai-api.ts';

// Add shutdown handling
addEventListener('beforeunload', (ev) => {
  console.log('=== Edge Function Shutdown ===');
  console.log('Shutdown reason:', ev.detail?.reason);
  console.log('Function instance is shutting down. Background tasks should continue via EdgeRuntime.waitUntil()');
});

serve(async (req) => {
  const requestId = crypto.randomUUID();
  const url = new URL(req.url);
  
  console.log(`=== ENHANCED EDGE FUNCTION START [${requestId}] ===`);
  console.log('Request URL:', req.url);
  console.log('Request method:', req.method);
  console.log('Timestamp:', new Date().toISOString());
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log(`[${requestId}] Handling CORS preflight request`);
    return handleCorsRequest();
  }

  // Health check endpoint
  if (url.pathname === '/health' && req.method === 'GET') {
    console.log(`[${requestId}] Health check requested`);
    try {
      const health = await healthCheck();
      return new Response(JSON.stringify(health), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error(`[${requestId}] Health check failed:`, error);
      return new Response(JSON.stringify({ 
        status: 'unhealthy', 
        error: error.message,
        timestamp: new Date().toISOString()
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }

  try {
    console.log(`[${requestId}] Starting authentication validation...`);
    const { userId, supabase } = await validateUserAuthentication(req);
    console.log(`[${requestId}] Authenticated user:`, userId);
    
    console.log(`[${requestId}] Reading request body...`);
    const { requestBody, bodyText } = await validateRequest(req);
    console.log(`[${requestId}] Request body parsed successfully, size:`, bodyText.length);
    
    validateRequestSize(bodyText);
    console.log(`[${requestId}] Request size validation passed`);
    
    const storyId = validateStoryId(requestBody.storyId);
    const artStyle = validateArtStyle(requestBody.artStyle);
    validateImageUrls(requestBody.imageUrls);
    console.log(`[${requestId}] Input validation completed - storyId: ${storyId}, artStyle: ${artStyle}, images: ${requestBody.imageUrls.length}`);
    
    await validateUserOwnership(supabase, userId, storyId);
    console.log(`[${requestId}] User ownership validated`);
    
    const { userId: storyUserId, cancelled } = await validateStoryExists(supabase, storyId);
    console.log(`[${requestId}] Story validation completed - owner: ${storyUserId}, cancelled: ${cancelled}`);
    
    if (storyUserId !== userId) {
      throw new Error(JSON.stringify({ 
        error: 'User does not own this story',
        code: 'OWNERSHIP_VIOLATION'
      }));
    }
    
    if (cancelled) {
      console.log(`[${requestId}] Story was cancelled before processing could start`);
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

    const SYNC_THRESHOLD = 3;
    console.log(`[${requestId}] Determining processing mode for ${requestBody.imageUrls.length} pages (threshold: ${SYNC_THRESHOLD})`);
    
    let result;
    
    if (requestBody.imageUrls.length <= SYNC_THRESHOLD) {
      console.log(`[${requestId}] [PROCESSING] Using synchronous mode for ${requestBody.imageUrls.length} pages`);
      result = await processSynchronously(storyId, requestBody.imageUrls, artStyle, userId, supabase);
      console.log(`[${requestId}] Synchronous processing completed:`, result);
      
      if (result.cancelled) {
        console.log(`[${requestId}] Processing was cancelled during synchronous mode`);
        return new Response(
          JSON.stringify({ success: false, message: result.message }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      console.log(`[${requestId}] [PROCESSING] Using enhanced asynchronous mode for ${requestBody.imageUrls.length} pages`);
      result = await startAsyncProcessing(storyId, requestBody.imageUrls, artStyle, userId, supabase);
      console.log(`[${requestId}] Asynchronous processing initiated:`, result);
    }

    console.log(`=== EDGE FUNCTION SUCCESS [${requestId}] ===`);
    console.log('Final result:', result);

    return new Response(
      JSON.stringify(result),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error(`=== EDGE FUNCTION ERROR [${requestId}] ===`);
    console.error('Error in transform-story function:', error);
    console.error('Error stack:', error.stack);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Timestamp:', new Date().toISOString());
    
    let errorResponse;
    try {
      errorResponse = JSON.parse(error.message);
    } catch {
      errorResponse = { 
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString(),
        requestId: requestId
      };
    }
    
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
