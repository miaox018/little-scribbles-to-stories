
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { validateAuth } from './auth-validation.ts';
import { validateEmailRequest, validateEnvironmentVariables, SendStoryEmailRequest } from './validation.ts';
import { fetchStoryData, sortStoryPages } from './story-service.ts';
import { sendStoryEmail } from './email-service.ts';
import { checkMaintenanceMode } from '../_shared/maintenance-check.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  console.log('🚀 Send story email function started');
  console.log('Request method:', req.method);
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log('📋 Handling CORS preflight request');
    return new Response(null, { headers: corsHeaders });
  }

  // Check maintenance mode
  const maintenanceResponse = checkMaintenanceMode();
  if (maintenanceResponse) {
    return maintenanceResponse;
  }

  try {
    // Validate environment variables
    const envValidation = validateEnvironmentVariables();
    if (!envValidation.isValid) {
      return new Response(JSON.stringify({ error: envValidation.error }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    console.log('✅ Environment variables validated');

    // Validate authentication
    const authHeader = req.headers.get('Authorization');
    const { user, error: authError } = await validateAuth(authHeader || '');
    
    if (authError || !user) {
      console.error('❌ Authentication failed:', authError);
      return new Response(JSON.stringify({ error: authError || 'Authentication failed' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Parse and validate request body
    let requestBody;
    try {
      requestBody = await req.json();
      console.log('📋 Request body parsed:', { 
        recipientEmail: requestBody.recipientEmail, 
        storyTitle: requestBody.storyTitle, 
        storyId: requestBody.storyId 
      });
    } catch (parseError) {
      console.error('❌ Failed to parse request body:', parseError);
      return new Response(JSON.stringify({ error: 'Invalid request body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const validation = validateEmailRequest(requestBody);
    if (!validation.isValid) {
      return new Response(JSON.stringify({ error: validation.error }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { recipientEmail, storyTitle, storyId, senderName }: SendStoryEmailRequest = requestBody;

    // Fetch story data
    const { story, error: storyError } = await fetchStoryData(storyId, user.id);
    if (storyError || !story) {
      return new Response(JSON.stringify({ error: storyError || 'Story not found' }), {
        status: storyError === 'Story not found or access denied' ? 403 : 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Prepare email data
    const sortedPages = sortStoryPages(story.story_pages);
    const sender = senderName || user.email || 'Someone';
    const origin = req.headers.get('origin') || 'https://storymagic.my-little-illustrator.com';
    const storyViewUrl = `${origin}/shared-story/${storyId}`;

    // Send email
    const emailResult = await sendStoryEmail({
      recipientEmail,
      sender,
      storyTitle,
      storyViewUrl,
      sortedPages,
      story
    });

    if (!emailResult.success) {
      return new Response(JSON.stringify({ error: emailResult.error }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const responseMessage = `Story "${storyTitle}" shared successfully with ${recipientEmail}! They can copy the link from the email to view it online.`;

    return new Response(JSON.stringify({ 
      success: true, 
      message: responseMessage,
      emailId: emailResult.emailId,
      storyViewUrl: storyViewUrl
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("❌ Unexpected error in send-story-email function:", error);
    return new Response(JSON.stringify({ 
      error: `Internal server error: ${error.message}` 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

serve(handler);
