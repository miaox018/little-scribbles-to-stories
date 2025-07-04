
export interface SendStoryEmailRequest {
  recipientEmail: string;
  storyTitle: string;
  storyId: string;
  senderName?: string;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export function validateEmailRequest(requestBody: any): ValidationResult {
  const { recipientEmail, storyTitle, storyId } = requestBody;

  // Validate required fields
  if (!recipientEmail || !storyTitle || !storyId) {
    console.error('❌ Missing required fields:', { 
      recipientEmail: !!recipientEmail, 
      storyTitle: !!storyTitle, 
      storyId: !!storyId 
    });
    return {
      isValid: false,
      error: 'Missing required fields: recipientEmail, storyTitle, and storyId are required'
    };
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(recipientEmail)) {
    console.error('❌ Invalid email format:', recipientEmail);
    return {
      isValid: false,
      error: 'Invalid email format'
    };
  }

  return { isValid: true };
}

export function validateEnvironmentVariables(): ValidationResult {
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  if (!resendApiKey) {
    console.error('❌ RESEND_API_KEY environment variable is not set');
    return {
      isValid: false,
      error: 'Email service configuration error'
    };
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase environment variables');
    return {
      isValid: false,
      error: 'Database configuration error'
    };
  }

  return { isValid: true };
}
