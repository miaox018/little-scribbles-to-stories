
import { Resend } from "npm:resend@2.0.0";
import { generateEmailTemplate, generateEmailSubject } from './email-template.ts';

export interface EmailData {
  recipientEmail: string;
  sender: string;
  storyTitle: string;
  storyViewUrl: string;
  sortedPages: any[];
  story: any;
}

export async function sendStoryEmail(emailData: EmailData): Promise<{ success: boolean; emailId?: string; error?: string }> {
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  if (!resendApiKey) {
    return { success: false, error: 'Email service configuration error' };
  }

  const resend = new Resend(resendApiKey);

  const emailSubject = generateEmailSubject(emailData.sender, emailData.storyTitle);
  const emailHtml = generateEmailTemplate({
    sender: emailData.sender,
    storyTitle: emailData.storyTitle,
    storyViewUrl: emailData.storyViewUrl,
    sortedPages: emailData.sortedPages,
    story: emailData.story
  });

  console.log('📧 Sending email with plain text link approach:', emailData.storyViewUrl);

  try {
    const emailResponse = await resend.emails.send({
      from: "StoryMagic <info@my-little-illustrator.com>",
      to: [emailData.recipientEmail],
      subject: emailSubject,
      html: emailHtml,
    });

    console.log("✅ Email sent successfully:", emailResponse);

    return { 
      success: true, 
      emailId: emailResponse.data?.id 
    };

  } catch (emailError: any) {
    console.error("❌ Resend email error:", emailError);
    return { 
      success: false, 
      error: `Failed to send email: ${emailError.message}` 
    };
  }
}
