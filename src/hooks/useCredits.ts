import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface CreditInfo {
  total_credits: number;
  used_credits: number;
  remaining_credits: number;
}

export interface CreditTransaction {
  id: string;
  transaction_type: 'purchase' | 'page_generation' | 'page_regeneration';
  credits_amount: number;
  description: string;
  created_at: string;
  story_id?: string;
  page_id?: string;
}

export const useCredits = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: creditInfo, isLoading: creditsLoading, refetch } = useQuery({
    queryKey: ['user-credits', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase.rpc('get_user_credit_info', {
        user_id_param: user.id
      });

      if (error) throw error;
      
      return data?.[0] || {
        total_credits: 4,
        used_credits: 0,
        remaining_credits: 4
      };
    },
    enabled: !!user,
  });

  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ['credit-transactions', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const checkCreditsAvailable = async (creditsNeeded: number): Promise<boolean> => {
    if (!user) return false;

    try {
      const { data, error } = await supabase.rpc('check_user_credits', {
        user_id_param: user.id,
        credits_needed: creditsNeeded
      });

      if (error) throw error;
      return data || false;
    } catch (error) {
      console.error('Error checking credits:', error);
      return false;
    }
  };

  const consumeCredits = async (
    creditsToConsume: number,
    transactionType: 'page_generation' | 'page_regeneration',
    storyId?: string,
    pageId?: string,
    description?: string
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      const { data, error } = await supabase.rpc('consume_credits', {
        user_id_param: user.id,
        credits_to_consume: creditsToConsume,
        transaction_type_param: transactionType,
        story_id_param: storyId,
        page_id_param: pageId,
        description_param: description
      });

      if (error) throw error;

      if (data) {
        // Refresh credit info
        await refetch();
        queryClient.invalidateQueries({ queryKey: ['credit-transactions', user.id] });
        return true;
      } else {
        toast({
          title: "Insufficient Credits",
          description: `You need ${creditsToConsume} credits but don't have enough. Purchase more credits to continue.`,
          variant: "destructive"
        });
        return false;
      }
    } catch (error) {
      console.error('Error consuming credits:', error);
      toast({
        title: "Error",
        description: "Failed to process credits. Please try again.",
        variant: "destructive"
      });
      return false;
    }
  };

  const addCredits = async (creditsToAdd: number, description = 'Credit purchase'): Promise<boolean> => {
    if (!user) return false;

    try {
      const { data, error } = await supabase.rpc('add_credits', {
        user_id_param: user.id,
        credits_to_add: creditsToAdd,
        description_param: description
      });

      if (error) throw error;

      if (data) {
        // Refresh credit info
        await refetch();
        queryClient.invalidateQueries({ queryKey: ['credit-transactions', user.id] });
        
        toast({
          title: "Credits Added! 💎",
          description: `${creditsToAdd} credits have been added to your account.`,
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error adding credits:', error);
      return false;
    }
  };

  const formatCreditsDisplay = (credits: number): string => {
    return `${credits} Credit${credits !== 1 ? 's' : ''}`;
  };

  const getCreditsNeededMessage = (needed: number, available: number): string => {
    const shortage = needed - available;
    return `You need ${needed} credits but only have ${available}. Purchase ${shortage} more credits to continue.`;
  };

  return {
    creditInfo: creditInfo || { total_credits: 4, used_credits: 0, remaining_credits: 4 },
    transactions: transactions || [],
    isLoading: creditsLoading,
    isTransactionsLoading: transactionsLoading,
    checkCreditsAvailable,
    consumeCredits,
    addCredits,
    refetchCredits: refetch,
    formatCreditsDisplay,
    getCreditsNeededMessage,
  };
};
