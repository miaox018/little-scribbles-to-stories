
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0";

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
});

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
  const signature = req.headers.get('stripe-signature');
  const body = await req.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature!,
      Deno.env.get('STRIPE_WEBHOOK_SECRET') || ''
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return new Response('Webhook signature verification failed', { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id;
        const tier = session.metadata?.tier;
        const couponCode = session.metadata?.coupon_code;

        console.log('Checkout session completed:', { userId, tier, customerId: session.customer });

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
            console.error('Error updating subscriber:', upsertError);
          } else {
            console.log('Successfully updated subscriber to tier:', tier);
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
            } catch (error) {
              console.error('Error recording coupon redemption:', error);
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

        console.log('Subscription event:', event.type, { customerId, status: subscription.status });

        // Determine tier from price
        let tier = 'free';
        if (subscription.items.data.length > 0) {
          const priceId = subscription.items.data[0].price.id;
          if (priceId === 'price_1RekA5Dc4yn7CE70Ob9Vjrpc') {
            tier = 'storypro';
          } else if (priceId === 'price_1RekAoDc4yn7CE70xnx1E5NJ') {
            tier = 'storypro_plus';
          }
        }

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
          console.error('Error updating subscription:', error);
        } else {
          console.log('Successfully updated subscription status:', { tier, status: subscription.status });
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        console.log('Subscription deleted:', { customerId });

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
          console.error('Error updating deleted subscription:', error);
        } else {
          console.log('Successfully updated deleted subscription');
        }
        break;
      }
    }

    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response('Webhook error', { status: 400 });
  }
});
