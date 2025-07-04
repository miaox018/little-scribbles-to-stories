
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export type SubscriptionTier = 'free' | 'storypro' | 'storypro_plus';

export interface UserLimits {
  subscription_tier: SubscriptionTier;
  stories_per_month: number;
  pages_per_story: number;
  regenerations_per_story: number;
}

export interface SubscriptionData {
  subscribed: boolean;
  subscription_tier: SubscriptionTier;
  subscription_end: string | null;
}

export const useSubscription = () => {
  const { user } = useAuth();

  const { data: subscription, isLoading: subscriptionLoading } = useQuery({
    queryKey: ['subscription', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('subscribers')
        .select('subscribed, subscription_tier, subscription_end')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      
      return data || {
        subscribed: false,
        subscription_tier: 'free' as SubscriptionTier,
        subscription_end: null
      };
    },
    enabled: !!user,
  });

  const { data: limits, isLoading: limitsLoading } = useQuery({
    queryKey: ['user-limits', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase.rpc('get_user_limits', {
        user_id_param: user.id
      });

      if (error) throw error;
      
      return data?.[0] || {
        subscription_tier: 'free',
        stories_per_month: 1,
        pages_per_story: 3, // Updated to reflect the correct free tier limit
        regenerations_per_story: 1
      };
    },
    enabled: !!user,
  });

  const createCheckoutSession = async (tier: 'storypro' | 'storypro_plus', couponCode?: string | null) => {
    console.log('Creating checkout session with tier:', tier, 'coupon:', couponCode);
    
    if (!user) {
      throw new Error('User must be authenticated to create checkout session');
    }

    // Get current session to ensure we have a valid token
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session?.access_token) {
      console.error('Session error:', sessionError);
      throw new Error('Authentication session is invalid. Please sign in again.');
    }

    console.log('Valid session found, proceeding with checkout...');

    // Actual Stripe Price IDs from your Stripe Dashboard
    const priceIds = {
      storypro: 'price_1RekA5Dc4yn7CE70Ob9Vjrpc', // StoryPro $4.99/month
      storypro_plus: 'price_1RekAoDc4yn7CE70xnx1E5NJ', // StoryPro+ $9.99/month
    };

    try {
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          priceId: priceIds[tier],
          tier: tier,
          couponCode: couponCode || undefined,
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        }
      });

      if (error) {
        console.error('Checkout session error:', error);
        
        // Provide more helpful error messages
        if (error.message?.includes('No such price')) {
          throw new Error('Payment configuration error. Please contact support.');
        } else if (error.message?.includes('Authentication')) {
          throw new Error('Please sign in again and try again.');
        } else {
          throw new Error(`Checkout failed: ${error.message}`);
        }
      }
      
      console.log('Checkout session created successfully:', data);
      
      // Open Stripe checkout in a new tab
      if (data?.url) {
        window.open(data.url, '_blank');
      } else {
        throw new Error('No checkout URL received from server');
      }
    } catch (err) {
      console.error('Error in createCheckoutSession:', err);
      throw err;
    }
  };

  return {
    subscription: subscription || { subscribed: false, subscription_tier: 'free' as SubscriptionTier, subscription_end: null },
    limits: limits || { subscription_tier: 'free', stories_per_month: 1, pages_per_story: 3, regenerations_per_story: 1 },
    isLoading: subscriptionLoading || limitsLoading,
    createCheckoutSession,
  };
};
