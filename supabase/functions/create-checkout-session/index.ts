
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('[CHECKOUT] Function started');

    // Create Supabase client with the anon key to get user info
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    console.log('[CHECKOUT] Getting user from auth');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    
    if (authError) {
      console.error('[CHECKOUT] Auth error:', authError);
      throw new Error(`Authentication failed: ${authError.message}`);
    }
    
    if (!user) {
      console.error('[CHECKOUT] No user found');
      throw new Error('User not authenticated');
    }

    console.log('[CHECKOUT] User authenticated:', user.id, user.email);

    const { priceId, tier, couponCode } = await req.json();
    console.log('[CHECKOUT] Request data:', { priceId, tier, couponCode });
    
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });

    // Create or get customer
    let customer;
    const { data: subscriber } = await supabaseClient
      .from('subscribers')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single();

    console.log('[CHECKOUT] Existing subscriber data:', subscriber);

    if (subscriber?.stripe_customer_id) {
      console.log('[CHECKOUT] Retrieving existing customer:', subscriber.stripe_customer_id);
      customer = await stripe.customers.retrieve(subscriber.stripe_customer_id);
    } else {
      console.log('[CHECKOUT] Creating new customer for:', user.email);
      customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id,
        },
      });

      console.log('[CHECKOUT] Created customer:', customer.id);

      // Update or create subscriber record
      await supabaseClient
        .from('subscribers')
        .upsert({
          user_id: user.id,
          email: user.email!,
          stripe_customer_id: customer.id,
        });

      console.log('[CHECKOUT] Updated subscriber record');
    }

    // Prepare session configuration
    const sessionConfig: any = {
      customer: customer.id,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${req.headers.get('origin')}/dashboard?success=true`,
      cancel_url: `${req.headers.get('origin')}/dashboard?canceled=true`,
      metadata: {
        user_id: user.id,
        tier: tier,
      },
    };

    console.log('[CHECKOUT] Base session config prepared');

    // Handle coupon code if provided
    if (couponCode) {
      console.log('[CHECKOUT] Processing coupon code:', couponCode);
      try {
        // Validate coupon in our database first
        const { data: couponValidation } = await supabaseClient.rpc('validate_coupon', {
          p_code: couponCode,
          p_user_id: user.id,
          p_tier: tier
        });

        console.log('[CHECKOUT] Coupon validation result:', couponValidation);

        if (couponValidation?.[0]?.valid) {
          // Create or get Stripe coupon
          let stripeCoupon;
          try {
            stripeCoupon = await stripe.coupons.retrieve(couponCode);
            console.log('[CHECKOUT] Retrieved existing Stripe coupon:', stripeCoupon.id);
          } catch (error) {
            // Create coupon in Stripe if it doesn't exist
            console.log('[CHECKOUT] Creating new Stripe coupon');
            const validation = couponValidation[0];
            const couponData: any = {
              id: couponCode,
              name: `Coupon ${couponCode}`,
            };

            if (validation.discount_percent > 0) {
              couponData.percent_off = validation.discount_percent;
            } else if (validation.discount_amount > 0) {
              couponData.amount_off = validation.discount_amount;
              couponData.currency = validation.currency || 'usd';
            }

            stripeCoupon = await stripe.coupons.create(couponData);
            console.log('[CHECKOUT] Created Stripe coupon:', stripeCoupon.id);
          }

          // Apply coupon to session
          sessionConfig.discounts = [{
            coupon: stripeCoupon.id,
          }];

          // Store coupon application in metadata for webhook processing
          sessionConfig.metadata.coupon_code = couponCode;
          console.log('[CHECKOUT] Applied coupon to session');
        } else {
          console.log('[CHECKOUT] Coupon validation failed');
        }
      } catch (error) {
        console.error('[CHECKOUT] Error processing coupon:', error);
        // Continue without coupon if there's an error
      }
    }

    console.log('[CHECKOUT] Creating Stripe session...');
    const session = await stripe.checkout.sessions.create(sessionConfig);
    console.log('[CHECKOUT] Created session:', session.id, session.url);

    return new Response(
      JSON.stringify({ url: session.url }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('[CHECKOUT] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
