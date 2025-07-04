
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendStoryEmailRequest {
  recipientEmail: string;
  storyTitle: string;
  storyId: string;
  senderName?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authorization required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Create Supabase client to verify user
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid authentication' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { recipientEmail, storyTitle, storyId, senderName }: SendStoryEmailRequest = await req.json();

    if (!recipientEmail || !storyTitle || !storyId) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Verify story ownership
    const { data: story, error: storyError } = await supabase
      .from('stories')
      .select('id, title, user_id')
      .eq('id', storyId)
      .eq('user_id', user.id)
      .single();

    if (storyError || !story) {
      return new Response(JSON.stringify({ error: 'Story not found or access denied' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const shareUrl = `${new URL(req.url).origin}/story/${storyId}`;
    const sender = senderName || user.email || 'Someone';

    const emailResponse = await resend.emails.send({
      from: "StoryMagic <onboarding@resend.dev>",
      to: [recipientEmail],
      subject: `${sender} shared a magical story with you: "${storyTitle}"`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #8B5CF6; margin: 0;">✨ StoryMagic</h1>
            <p style="color: #666; margin: 5px 0;">Transform children's drawings into magical storybooks</p>
          </div>
          
          <div style="background: linear-gradient(135deg, #f3e8ff, #fce7f3); padding: 30px; border-radius: 12px; margin-bottom: 30px;">
            <h2 style="color: #333; margin-top: 0;">📖 You've received a magical story!</h2>
            <p style="color: #555; font-size: 16px; line-height: 1.6;">
              ${sender} has shared the story <strong>"${storyTitle}"</strong> with you through StoryMagic.
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${shareUrl}" 
               style="background: linear-gradient(135deg, #8B5CF6, #EC4899); 
                      color: white; 
                      text-decoration: none; 
                      padding: 15px 30px; 
                      border-radius: 8px; 
                      display: inline-block; 
                      font-weight: bold;
                      box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);">
              📚 Read the Story
            </a>
          </div>
          
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="color: #666; margin: 0; font-size: 14px;">
              If the button doesn't work, copy and paste this link into your browser:<br>
              <a href="${shareUrl}" style="color: #8B5CF6; word-break: break-all;">${shareUrl}</a>
            </p>
          </div>
          
          <div style="text-align: center; padding-top: 20px; border-top: 1px solid #eee; margin-top: 30px;">
            <p style="color: #999; font-size: 12px; margin: 0;">
              This email was sent from StoryMagic. If you didn't expect this email, you can safely ignore it.
            </p>
          </div>
        </div>
      `,
    });

    console.log("Story sharing email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Story shared successfully with ${recipientEmail}` 
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Error in send-story-email function:", error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Failed to send email' 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

serve(handler);
