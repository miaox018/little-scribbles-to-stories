
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { corsHeaders } from './config.ts';
import { handleCorsRequest, validateRequest, validateRequestBody } from './request-handler.ts';
import { validateStoryExists } from './story-validation.ts';
import { processSynchronously } from './sync-processor.ts';
import { startAsyncProcessing } from './async-processor.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  console.log('=== EDGE FUNCTION START ===');
  console.log('Request URL:', req.url);
  console.log('Request method:', req.method);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return handleCorsRequest();
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Validate and parse request
    const { requestBody } = await validateRequest(req);
    const { storyId, imageUrls, artStyle } = validateRequestBody(requestBody);

    // Validate story exists and get user info
    const { userId, cancelled } = await validateStoryExists(supabase, storyId);
    
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

    // HYBRID PROCESSING LOGIC
    const SYNC_THRESHOLD = 3; // Process ≤3 images synchronously, >3 asynchronously
    
    let result;
    
    if (imageUrls.length <= SYNC_THRESHOLD) {
      // Process synchronously
      result = await processSynchronously(storyId, imageUrls, artStyle, userId, supabase);
      
      if (result.cancelled) {
        return new Response(
          JSON.stringify({ success: false, message: result.message }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      // Process asynchronously
      result = await startAsyncProcessing(storyId, imageUrls, artStyle, userId, supabase);
    }

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
    
    // Try to parse error message if it's JSON
    let errorResponse;
    try {
      errorResponse = JSON.parse(error.message);
    } catch {
      errorResponse = { 
        error: error.message,
        stack: error.stack,
        type: error.constructor.name
      };
    }
    
    return new Response(
      JSON.stringify(errorResponse),
      { 
        status: errorResponse.error?.includes('Empty request body') || errorResponse.error?.includes('Invalid JSON') ? 400 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
