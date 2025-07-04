
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

export interface AuthResult {
  user: any;
  error?: string;
}

export async function validateAuth(authHeader: string): Promise<AuthResult> {
  console.log('🔐 Starting authentication validation...');
  
  if (!authHeader) {
    console.error('❌ No authorization header provided');
    return { user: null, error: 'Authorization required' };
  }

  // Extract JWT token from Bearer header
  const token = authHeader.replace('Bearer ', '');
  if (!token) {
    console.error('❌ No JWT token found in authorization header');
    return { user: null, error: 'Invalid authorization format' };
  }

  try {
    // Create Supabase client with service role key for JWT validation
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Missing Supabase environment variables');
      return { user: null, error: 'Server configuration error' };
    }

    console.log('✅ Creating Supabase client for JWT validation...');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Validate the JWT token using service role client
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError) {
      console.error('❌ JWT validation failed:', authError.message);
      return { user: null, error: 'Invalid or expired token' };
    }

    if (!user) {
      console.error('❌ No user found for token');
      return { user: null, error: 'User not found' };
    }

    console.log('✅ User authenticated successfully:', user.id);
    return { user, error: undefined };

  } catch (error: any) {
    console.error('❌ Authentication error:', error.message);
    return { user: null, error: 'Authentication failed' };
  }
}
