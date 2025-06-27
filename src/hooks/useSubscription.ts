
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
        pages_per_story: 8,
        regenerations_per_story: 1
      };
    },
    enabled: !!user,
  });

  const createCheckoutSession = async (tier: 'storypro' | 'storypro_plus') => {
    const priceIds = {
      storypro: 'price_1234567890', // Replace with actual Stripe price ID
      storypro_plus: 'price_0987654321', // Replace with actual Stripe price ID
    };

    const { data, error } = await supabase.functions.invoke('create-checkout-session', {
      body: {
        priceId: priceIds[tier],
        tier: tier,
      }
    });

    if (error) throw error;
    
    // Open Stripe checkout in a new tab
    window.open(data.url, '_blank');
  };

  return {
    subscription: subscription || { subscribed: false, subscription_tier: 'free' as SubscriptionTier, subscription_end: null },
    limits: limits || { subscription_tier: 'free', stories_per_month: 1, pages_per_story: 8, regenerations_per_story: 1 },
    isLoading: subscriptionLoading || limitsLoading,
    createCheckoutSession,
  };
};
