-- Migration: Implement Credit-Based System
-- Date: 2025-09-14
-- Description: Replace subscription limits with flexible credit system

-- Create user_credits table
CREATE TABLE IF NOT EXISTS public.user_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  total_credits INTEGER NOT NULL DEFAULT 4, -- Free users start with 4 credits
  used_credits INTEGER NOT NULL DEFAULT 0,
  remaining_credits INTEGER GENERATED ALWAYS AS (total_credits - used_credits) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create credit_transactions table for tracking usage
CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
  page_id UUID REFERENCES story_pages(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('purchase', 'page_generation', 'page_regeneration')),
  credits_amount INTEGER NOT NULL, -- Positive for purchases, negative for usage
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_credits
CREATE POLICY "Users can view their own credits" ON public.user_credits
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Service role can manage credits" ON public.user_credits
FOR ALL USING (true);

-- RLS Policies for credit_transactions
CREATE POLICY "Users can view their own transactions" ON public.credit_transactions
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Service role can manage transactions" ON public.credit_transactions
FOR ALL USING (true);

-- Function to initialize credits for new users
CREATE OR REPLACE FUNCTION public.initialize_user_credits()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.user_credits (user_id, total_credits, used_credits)
  VALUES (NEW.id, 4, 0)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Trigger to auto-create credits for new users
DROP TRIGGER IF EXISTS on_auth_user_created_initialize_credits ON auth.users;
CREATE TRIGGER on_auth_user_created_initialize_credits
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.initialize_user_credits();

-- Function to check if user has enough credits
CREATE OR REPLACE FUNCTION public.check_user_credits(user_id_param UUID, credits_needed INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  remaining INTEGER;
BEGIN
  -- Admin users have unlimited credits
  IF public.is_admin(user_id_param) THEN
    RETURN TRUE;
  END IF;

  SELECT remaining_credits INTO remaining
  FROM public.user_credits
  WHERE user_id = user_id_param;
  
  RETURN COALESCE(remaining, 0) >= credits_needed;
END;
$$;

-- Function to consume credits
CREATE OR REPLACE FUNCTION public.consume_credits(
  user_id_param UUID, 
  credits_to_consume INTEGER,
  transaction_type_param TEXT,
  story_id_param UUID DEFAULT NULL,
  page_id_param UUID DEFAULT NULL,
  description_param TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_remaining INTEGER;
BEGIN
  -- Admin users don't consume credits
  IF public.is_admin(user_id_param) THEN
    RETURN TRUE;
  END IF;

  -- Check if user has enough credits
  SELECT remaining_credits INTO current_remaining
  FROM public.user_credits
  WHERE user_id = user_id_param;
  
  IF COALESCE(current_remaining, 0) < credits_to_consume THEN
    RETURN FALSE;
  END IF;
  
  -- Update used credits
  UPDATE public.user_credits
  SET used_credits = used_credits + credits_to_consume,
      updated_at = now()
  WHERE user_id = user_id_param;
  
  -- Record transaction
  INSERT INTO public.credit_transactions (
    user_id, 
    story_id, 
    page_id, 
    transaction_type, 
    credits_amount, 
    description
  ) VALUES (
    user_id_param, 
    story_id_param, 
    page_id_param, 
    transaction_type_param, 
    -credits_to_consume, 
    COALESCE(description_param, transaction_type_param)
  );
  
  RETURN TRUE;
END;
$$;

-- Function to add credits (for purchases)
CREATE OR REPLACE FUNCTION public.add_credits(
  user_id_param UUID, 
  credits_to_add INTEGER,
  description_param TEXT DEFAULT 'Credit purchase'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update total credits
  UPDATE public.user_credits
  SET total_credits = total_credits + credits_to_add,
      updated_at = now()
  WHERE user_id = user_id_param;
  
  -- Record transaction
  INSERT INTO public.credit_transactions (
    user_id, 
    transaction_type, 
    credits_amount, 
    description
  ) VALUES (
    user_id_param, 
    'purchase', 
    credits_to_add, 
    description_param
  );
  
  RETURN TRUE;
END;
$$;

-- Function to get user credit info
CREATE OR REPLACE FUNCTION public.get_user_credit_info(user_id_param UUID)
RETURNS TABLE(
  total_credits INTEGER,
  used_credits INTEGER,
  remaining_credits INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    uc.total_credits,
    uc.used_credits,
    uc.remaining_credits
  FROM public.user_credits uc
  WHERE uc.user_id = user_id_param;
END;
$$;

-- Initialize credits for existing users
INSERT INTO public.user_credits (user_id, total_credits, used_credits)
SELECT 
  id as user_id,
  4 as total_credits,
  0 as used_credits
FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

-- Update existing validation functions to use credits instead
CREATE OR REPLACE FUNCTION public.can_create_story(user_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- With credit system, users can create stories as long as they have credits for pages
  -- We'll check credits when they actually upload pages
  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.can_upload_pages(user_id_param UUID, story_id_param UUID, page_count INTEGER DEFAULT 1)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN public.check_user_credits(user_id_param, page_count);
END;
$$;

CREATE OR REPLACE FUNCTION public.can_regenerate_pages(user_id_param UUID, story_id_param UUID, additional_regens INTEGER DEFAULT 1)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN public.check_user_credits(user_id_param, additional_regens);
END;
$$;
