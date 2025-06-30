
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const signature = req.headers.get('stripe-signature');
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  
  console.log('[WEBHOOK] Function started');
  console.log('[WEBHOOK] Signature present:', !!signature);
  console.log('[WEBHOOK] Webhook secret configured:', !!webhookSecret);

  if (!signature) {
    console.error('[WEBHOOK] No stripe-signature header found');
    return new Response('No stripe-signature header found', { 
      status: 400,
      headers: corsHeaders 
    });
  }

  if (!webhookSecret) {
    console.error('[WEBHOOK] STRIPE_WEBHOOK_SECRET not configured');
    return new Response('Webhook secret not configured', { 
      status: 500,
      headers: corsHeaders 
    });
  }

  const body = await req.text();
  console.log('[WEBHOOK] Body length:', body.length);

  const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
    apiVersion: '2023-10-16',
  });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    console.log('[WEBHOOK] Event constructed successfully:', event.type);
  } catch (err) {
    console.error('[WEBHOOK] Webhook signature verification failed:', err);
    return new Response(`Webhook signature verification failed: ${err.message}`, { 
      status: 400,
      headers: corsHeaders 
    });
  }

  try {
    console.log('[WEBHOOK] Processing event:', event.type);
    
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id;
        const tier = session.metadata?.tier;
        const couponCode = session.metadata?.coupon_code;

        console.log('[WEBHOOK] Checkout session completed:', { 
          userId, 
          tier, 
          customerId: session.customer,
          subscriptionId: session.subscription 
        });

        if (userId && tier) {
          // Update subscriber record with new tier
          const { error: upsertError } = await supabase
            .from('subscribers')
            .upsert({
              user_id: userId,
              email: session.customer_details?.email || '',
              stripe_customer_id: session.customer as string,
              stripe_subscription_id: session.subscription as string,
              subscribed: true,
              subscription_tier: tier,
              subscription_end: null, // Will be updated by subscription events
              updated_at: new Date().toISOString(),
            }, {
              onConflict: 'user_id'
            });

          if (upsertError) {
            console.error('[WEBHOOK] Error updating subscriber:', upsertError);
          } else {
            console.log('[WEBHOOK] Successfully updated subscriber to tier:', tier);
          }

          // Record coupon redemption if coupon was used
          if (couponCode) {
            try {
              // Calculate discount applied
              let discountApplied = 0;
              if (session.total_details?.amount_discount) {
                discountApplied = session.total_details.amount_discount;
              }

              await supabase.rpc('record_coupon_redemption', {
                p_code: couponCode,
                p_user_id: userId,
                p_tier: tier,
                p_discount_applied: discountApplied
              });
              console.log('[WEBHOOK] Coupon redemption recorded:', couponCode);
            } catch (error) {
              console.error('[WEBHOOK] Error recording coupon redemption:', error);
              // Don't fail the webhook for coupon tracking errors
            }
          }
        }
        break;
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        console.log('[WEBHOOK] Subscription event:', event.type, { 
          customerId, 
          status: subscription.status,
          priceId: subscription.items.data[0]?.price.id 
        });

        // Determine tier from price
        let tier = 'free';
        if (subscription.items.data.length > 0) {
          const priceId = subscription.items.data[0].price.id;
          console.log('[WEBHOOK] Price ID:', priceId);
          
          if (priceId === 'price_1RekA5Dc4yn7CE70Ob9Vjrpc') {
            tier = 'storypro';
          } else if (priceId === 'price_1RekAoDc4yn7CE70xnx1E5NJ') {
            tier = 'storypro_plus';
          }
        }

        console.log('[WEBHOOK] Determined tier:', tier);

        const { error } = await supabase
          .from('subscribers')
          .update({
            subscribed: subscription.status === 'active',
            subscription_tier: subscription.status === 'active' ? tier : 'free',
            subscription_end: subscription.status === 'active' 
              ? null 
              : new Date(subscription.current_period_end * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_customer_id', customerId);

        if (error) {
          console.error('[WEBHOOK] Error updating subscription:', error);
        } else {
          console.log('[WEBHOOK] Successfully updated subscription status:', { tier, status: subscription.status });
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        console.log('[WEBHOOK] Subscription deleted:', { customerId });

        const { error } = await supabase
          .from('subscribers')
          .update({
            subscribed: false,
            subscription_tier: 'free',
            subscription_end: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_customer_id', customerId);

        if (error) {
          console.error('[WEBHOOK] Error updating deleted subscription:', error);
        } else {
          console.log('[WEBHOOK] Successfully updated deleted subscription');
        }
        break;
      }

      default:
        console.log('[WEBHOOK] Unhandled event type:', event.type);
    }

    console.log('[WEBHOOK] Event processed successfully');
    return new Response('OK', { status: 200, headers: corsHeaders });
  } catch (error) {
    console.error('[WEBHOOK] Error processing webhook:', error);
    return new Response(`Webhook error: ${error.message}`, { 
      status: 400,
      headers: corsHeaders 
    });
  }
});
