
-- Create table for coupon codes
CREATE TABLE public.coupon_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  discount_percent INTEGER CHECK (discount_percent >= 0 AND discount_percent <= 100),
  discount_amount INTEGER CHECK (discount_amount >= 0),
  currency TEXT DEFAULT 'usd',
  max_redemptions INTEGER CHECK (max_redemptions > 0),
  current_redemptions INTEGER NOT NULL DEFAULT 0,
  valid_from TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  valid_until TIMESTAMP WITH TIME ZONE,
  applicable_tiers TEXT[] DEFAULT ARRAY['storypro', 'storypro_plus'],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Create table to track coupon redemptions
CREATE TABLE public.coupon_redemptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  coupon_code_id UUID REFERENCES public.coupon_codes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  redeemed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  subscription_tier TEXT NOT NULL,
  discount_applied INTEGER NOT NULL
);

-- Enable RLS on both tables
ALTER TABLE public.coupon_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_redemptions ENABLE ROW LEVEL SECURITY;

-- Policies for coupon_codes (users can only read active coupons)
CREATE POLICY "Users can view active coupon codes" 
  ON public.coupon_codes 
  FOR SELECT 
  USING (is_active = true AND (valid_until IS NULL OR valid_until > now()));

-- Policies for coupon_redemptions (users can only see their own redemptions)
CREATE POLICY "Users can view their own redemptions" 
  ON public.coupon_redemptions 
  FOR SELECT 
  USING (user_id = auth.uid());

-- Function to validate and apply coupon
CREATE OR REPLACE FUNCTION public.validate_coupon(
  p_code TEXT,
  p_user_id UUID,
  p_tier TEXT
) RETURNS TABLE(
  valid BOOLEAN,
  discount_percent INTEGER,
  discount_amount INTEGER,
  currency TEXT,
  error_message TEXT
) AS $$
DECLARE
  coupon_record RECORD;
  user_redemptions INTEGER;
BEGIN
  -- Get coupon details
  SELECT * INTO coupon_record
  FROM public.coupon_codes
  WHERE code = p_code 
    AND is_active = true
    AND (valid_until IS NULL OR valid_until > now())
    AND p_tier = ANY(applicable_tiers);

  -- Check if coupon exists and is valid
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 0, 0, ''::TEXT, 'Invalid or expired coupon code';
    RETURN;
  END IF;

  -- Check if max redemptions reached
  IF coupon_record.current_redemptions >= coupon_record.max_redemptions THEN
    RETURN QUERY SELECT false, 0, 0, ''::TEXT, 'Coupon has reached maximum redemptions';
    RETURN;
  END IF;

  -- Check if user has already used this coupon
  SELECT COUNT(*) INTO user_redemptions
  FROM public.coupon_redemptions
  WHERE coupon_code_id = coupon_record.id AND user_id = p_user_id;

  IF user_redemptions > 0 THEN
    RETURN QUERY SELECT false, 0, 0, ''::TEXT, 'You have already used this coupon';
    RETURN;
  END IF;

  -- Return valid coupon details
  RETURN QUERY SELECT 
    true, 
    coupon_record.discount_percent, 
    coupon_record.discount_amount, 
    coupon_record.currency,
    ''::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record coupon redemption
CREATE OR REPLACE FUNCTION public.record_coupon_redemption(
  p_code TEXT,
  p_user_id UUID,
  p_tier TEXT,
  p_discount_applied INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
  coupon_id UUID;
BEGIN
  -- Get coupon ID and increment redemption count
  UPDATE public.coupon_codes
  SET current_redemptions = current_redemptions + 1,
      updated_at = now()
  WHERE code = p_code
  RETURNING id INTO coupon_id;

  -- Record the redemption
  INSERT INTO public.coupon_redemptions (
    coupon_code_id, user_id, subscription_tier, discount_applied
  ) VALUES (
    coupon_id, p_user_id, p_tier, p_discount_applied
  );

  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
