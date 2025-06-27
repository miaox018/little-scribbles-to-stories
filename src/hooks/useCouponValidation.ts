
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface CouponValidation {
  valid: boolean;
  discount_percent: number;
  discount_amount: number;
  currency: string;
  error_message: string;
}

export const useCouponValidation = () => {
  const [isValidating, setIsValidating] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponDiscount, setCouponDiscount] = useState<CouponValidation | null>(null);
  const { user } = useAuth();

  const validateCoupon = async (code: string, tier: 'storypro' | 'storypro_plus') => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to apply coupons",
        variant: "destructive"
      });
      return;
    }

    if (!code.trim()) {
      toast({
        title: "Error",
        description: "Please enter a coupon code",
        variant: "destructive"
      });
      return;
    }

    setIsValidating(true);
    try {
      const { data, error } = await supabase.rpc('validate_coupon', {
        p_code: code.trim().toUpperCase(),
        p_user_id: user.id,
        p_tier: tier
      });

      if (error) throw error;

      const validation = data?.[0] as CouponValidation;
      
      if (validation?.valid) {
        setAppliedCoupon(code.trim().toUpperCase());
        setCouponDiscount(validation);
        toast({
          title: "Coupon Applied!",
          description: validation.discount_percent 
            ? `${validation.discount_percent}% discount applied`
            : `$${(validation.discount_amount / 100).toFixed(2)} discount applied`
        });
      } else {
        toast({
          title: "Invalid Coupon",
          description: validation?.error_message || "Coupon code is not valid",
          variant: "destructive"
        });
        removeCoupon();
      }
    } catch (error) {
      console.error('Error validating coupon:', error);
      toast({
        title: "Error",
        description: "Failed to validate coupon. Please try again.",
        variant: "destructive"
      });
      removeCoupon();
    } finally {
      setIsValidating(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponDiscount(null);
  };

  return {
    validateCoupon,
    removeCoupon,
    isValidating,
    appliedCoupon,
    couponDiscount
  };
};
