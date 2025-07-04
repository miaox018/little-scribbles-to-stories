
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { Resend } from "npm:resend@2.0.0";
import { validateAuth } from './auth-validation.ts';
import { generateStoryPDF } from './pdf-generator.ts';

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
  console.log('🚀 Send story email function started');
  console.log('Request method:', req.method);
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log('📋 Handling CORS preflight request');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check if RESEND_API_KEY exists
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error('❌ RESEND_API_KEY environment variable is not set');
      return new Response(JSON.stringify({ error: 'Email service configuration error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    console.log('✅ RESEND_API_KEY found');

    const resend = new Resend(resendApiKey);

    // Validate authentication using the new auth validation module
    const authHeader = req.headers.get('Authorization');
    const { user, error: authError } = await validateAuth(authHeader || '');
    
    if (authError || !user) {
      console.error('❌ Authentication failed:', authError);
      return new Response(JSON.stringify({ error: authError || 'Authentication failed' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Parse request body
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

    const { recipientEmail, storyTitle, storyId, senderName }: SendStoryEmailRequest = requestBody;

    // Validate required fields
    if (!recipientEmail || !storyTitle || !storyId) {
      console.error('❌ Missing required fields:', { recipientEmail: !!recipientEmail, storyTitle: !!storyTitle, storyId: !!storyId });
      return new Response(JSON.stringify({ error: 'Missing required fields: recipientEmail, storyTitle, and storyId are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail)) {
      console.error('❌ Invalid email format:', recipientEmail);
      return new Response(JSON.stringify({ error: 'Invalid email format' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('🔍 Fetching story data...');
    
    // Create Supabase client with service role key for database operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Missing Supabase environment variables');
      return new Response(JSON.stringify({ error: 'Database configuration error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify story ownership and fetch story data
    const { data: story, error: storyError } = await supabase
      .from('stories')
      .select(`
        *,
        story_pages (
          id,
          page_number,
          original_image_url,
          generated_image_url,
          transformation_status
        )
      `)
      .eq('id', storyId)
      .eq('user_id', user.id)
      .single();

    if (storyError) {
      console.error('❌ Story query error:', storyError);
      return new Response(JSON.stringify({ error: 'Story not found or access denied' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!story) {
      console.error('❌ Story not found for user:', user.id, 'story:', storyId);
      return new Response(JSON.stringify({ error: 'Story not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('✅ Story found:', story.title, 'with', story.story_pages?.length || 0, 'pages');

    // Sort pages by page number
    const sortedPages = story.story_pages?.sort((a: any, b: any) => a.page_number - b.page_number) || [];

    const sender = senderName || user.email || 'Someone';

    // Generate PDF
    let pdfBuffer: Uint8Array | null = null;
    let pdfError: string | null = null;

    try {
      console.log('📄 Generating PDF for story...');
      pdfBuffer = await generateStoryPDF(story, sortedPages);
      console.log('✅ PDF generated successfully');
    } catch (error: any) {
      console.error('❌ PDF generation failed:', error);
      pdfError = error.message;
      // Continue without PDF - we'll send the email anyway
    }

    // Prepare email content
    const emailSubject = `${sender} shared a magical story with you: "${storyTitle}"`;
    const pdfAttachment = pdfBuffer ? {
      filename: `${storyTitle.replace(/[^a-zA-Z0-9]/g, '_')}_StoryMagic.pdf`,
      content: Array.from(pdfBuffer),
      contentType: 'application/pdf'
    } : null;

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #8B5CF6; margin: 0;">✨ StoryMagic</h1>
          <p style="color: #666; margin: 5px 0;">Transform children's drawings into magical storybooks</p>
        </div>
        
        <div style="background: linear-gradient(135deg, #f3e8ff, #fce7f3); padding: 30px; border-radius: 12px; margin-bottom: 30px;">
          <h2 style="color: #333; margin-top: 0;">📚 You've received a magical story!</h2>
          <p style="color: #555; font-size: 16px; line-height: 1.6;">
            ${sender} has shared the story <strong>"${storyTitle}"</strong> with you through StoryMagic.
          </p>
          <p style="color: #555; font-size: 16px; line-height: 1.6;">
            This story contains ${sortedPages.length} magical pages created from children's drawings.
          </p>
          ${pdfAttachment ? `
            <div style="background: rgba(139, 92, 246, 0.1); padding: 15px; border-radius: 8px; margin-top: 20px;">
              <p style="color: #8B5CF6; font-weight: bold; margin: 0; font-size: 14px;">
                📎 PDF attachment included! You can download and keep this magical story forever.
              </p>
            </div>
          ` : `
            <div style="background: rgba(249, 115, 22, 0.1); padding: 15px; border-radius: 8px; margin-top: 20px;">
              <p style="color: #f97316; font-weight: bold; margin: 0; font-size: 14px;">
                📋 Note: PDF could not be generated, but the story information is below.
              </p>
            </div>
          `}
        </div>
        
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #333; margin-top: 0;">📖 About this story:</h3>
          <ul style="color: #666; line-height: 1.6;">
            <li><strong>Title:</strong> ${storyTitle}</li>
            <li><strong>Pages:</strong> ${sortedPages.length}</li>
            <li><strong>Shared by:</strong> ${sender}</li>
            <li><strong>Art Style:</strong> ${story.art_style || 'Classic Watercolor'}</li>
            ${pdfAttachment ? '<li><strong>PDF:</strong> Attached to this email</li>' : ''}
          </ul>
        </div>

        <div style="text-align: center; padding: 20px; background: #8B5CF6; color: white; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0;">🎨 Create Your Own Magic</h3>
          <p style="margin: 0; font-size: 14px;">
            Visit StoryMagic to transform your children's drawings into magical storybooks!
          </p>
        </div>
        
        <div style="text-align: center; padding-top: 20px; border-top: 1px solid #eee; margin-top: 30px;">
          <p style="color: #999; font-size: 12px; margin: 0;">
            This email was sent from StoryMagic. If you didn't expect this email, you can safely ignore it.
          </p>
        </div>
      </div>
    `;

    console.log('📧 Sending email with' + (pdfAttachment ? ' PDF attachment...' : 'out PDF...'));

    try {
      const emailData: any = {
        from: "StoryMagic <onboarding@resend.dev>",
        to: [recipientEmail],
        subject: emailSubject,
        html: emailHtml,
      };

      // Add PDF attachment if available
      if (pdfAttachment) {
        emailData.attachments = [pdfAttachment];
      }

      const emailResponse = await resend.emails.send(emailData);

      console.log("✅ Email sent successfully:", emailResponse);

      const responseMessage = pdfAttachment 
        ? `Story "${storyTitle}" with PDF attachment sent successfully to ${recipientEmail}`
        : `Story information sent to ${recipientEmail}${pdfError ? ` (PDF generation failed: ${pdfError})` : ''}`;

      return new Response(JSON.stringify({ 
        success: true, 
        message: responseMessage,
        emailId: emailResponse.data?.id,
        pdfIncluded: !!pdfAttachment,
        pdfError: pdfError
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } catch (emailError: any) {
      console.error("❌ Resend email error:", emailError);
      return new Response(JSON.stringify({ 
        error: `Failed to send email: ${emailError.message}` 
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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
