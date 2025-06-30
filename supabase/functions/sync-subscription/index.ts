
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0";

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
    console.log('[SYNC] Manual subscription sync started');

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header provided');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user?.email) throw new Error('User not authenticated or email not available');

    console.log('[SYNC] User authenticated:', { userId: user.id, email: user.email });

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });

    // Find customer by email
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    if (customers.data.length === 0) {
      console.log('[SYNC] No Stripe customer found');
      return new Response(JSON.stringify({ 
        error: 'No Stripe customer found',
        subscribed: false 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    console.log('[SYNC] Found customer:', customerId);

    // Get active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      limit: 10,
    });

    console.log('[SYNC] Found active subscriptions:', subscriptions.data.length);

    if (subscriptions.data.length === 0) {
      // No active subscriptions
      const { error } = await supabaseServiceClient
        .from('subscribers')
        .upsert({
          user_id: user.id,
          email: user.email,
          stripe_customer_id: customerId,
          subscribed: false,
          subscription_tier: 'free',
          subscription_end: null,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      if (error) {
        console.error('[SYNC] Error updating subscriber:', error);
        throw error;
      }

      return new Response(JSON.stringify({
        subscribed: false,
        subscription_tier: 'free',
        message: 'No active subscriptions found'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Process the first active subscription
    const subscription = subscriptions.data[0];
    const priceId = subscription.items.data[0].price.id;
    
    console.log('[SYNC] Processing subscription:', {
      subscriptionId: subscription.id,
      priceId: priceId,
      status: subscription.status
    });

    // Determine tier from price ID
    let tier = 'free';
    if (priceId === 'price_1RekA5Dc4yn7CE70Ob9Vjrpc') {
      tier = 'storypro';
    } else if (priceId === 'price_1RekAoDc4yn7CE70xnx1E5NJ') {
      tier = 'storypro_plus';
    }

    console.log('[SYNC] Determined tier:', tier);

    // Update Supabase
    const { error } = await supabaseServiceClient
      .from('subscribers')
      .upsert({
        user_id: user.id,
        email: user.email,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscription.id,
        subscribed: subscription.status === 'active',
        subscription_tier: tier,
        subscription_end: subscription.status === 'active' 
          ? null 
          : new Date(subscription.current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    if (error) {
      console.error('[SYNC] Error updating subscriber:', error);
      throw error;
    }

    console.log('[SYNC] Successfully updated subscription status');

    return new Response(JSON.stringify({
      subscribed: subscription.status === 'active',
      subscription_tier: tier,
      subscription_end: subscription.current_period_end,
      message: 'Subscription synced successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('[SYNC] Error in sync function:', error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
