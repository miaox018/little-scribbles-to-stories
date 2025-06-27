
-- Create enum for subscription tiers
CREATE TYPE public.subscription_tier AS ENUM ('free', 'storypro', 'storypro_plus');

-- Create subscribers table to track subscription information
CREATE TABLE public.subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  email TEXT NOT NULL UNIQUE,
  stripe_customer_id TEXT,
  subscribed BOOLEAN NOT NULL DEFAULT false,
  subscription_tier subscription_tier NOT NULL DEFAULT 'free',
  subscription_end TIMESTAMPTZ,
  stripe_subscription_id TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create usage tracking table
CREATE TABLE public.usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE NOT NULL,
  pages_uploaded INTEGER NOT NULL DEFAULT 0,
  pages_regenerated INTEGER NOT NULL DEFAULT 0,
  month_year TEXT NOT NULL, -- Format: YYYY-MM for monthly tracking
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, story_id)
);

-- Create monthly usage summary table
CREATE TABLE public.monthly_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  month_year TEXT NOT NULL, -- Format: YYYY-MM
  stories_created INTEGER NOT NULL DEFAULT 0,
  total_pages_uploaded INTEGER NOT NULL DEFAULT 0,
  total_pages_regenerated INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, month_year)
);

-- Enable Row Level Security
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_usage ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for subscribers
CREATE POLICY "Users can view their own subscription" ON public.subscribers
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Service role can manage subscriptions" ON public.subscribers
FOR ALL USING (true);

-- Create RLS policies for usage_tracking
CREATE POLICY "Users can view their own usage" ON public.usage_tracking
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Service role can manage usage" ON public.usage_tracking
FOR ALL USING (true);

-- Create RLS policies for monthly_usage
CREATE POLICY "Users can view their own monthly usage" ON public.monthly_usage
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Service role can manage monthly usage" ON public.monthly_usage
FOR ALL USING (true);

-- Function to get user's subscription tier and limits
CREATE OR REPLACE FUNCTION public.get_user_limits(user_id_param UUID)
RETURNS TABLE(
  subscription_tier TEXT,
  stories_per_month INTEGER,
  pages_per_story INTEGER,
  regenerations_per_story INTEGER
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.subscription_tier::TEXT,
    CASE 
      WHEN s.subscription_tier = 'free' THEN 1
      WHEN s.subscription_tier = 'storypro' THEN 5
      WHEN s.subscription_tier = 'storypro_plus' THEN 10
      ELSE 1
    END as stories_per_month,
    CASE 
      WHEN s.subscription_tier = 'free' THEN 8
      WHEN s.subscription_tier = 'storypro' THEN 12
      WHEN s.subscription_tier = 'storypro_plus' THEN 15
      ELSE 8
    END as pages_per_story,
    CASE 
      WHEN s.subscription_tier = 'free' THEN 1
      WHEN s.subscription_tier = 'storypro' THEN 3
      WHEN s.subscription_tier = 'storypro_plus' THEN 5
      ELSE 1
    END as regenerations_per_story
  FROM public.subscribers s
  WHERE s.user_id = user_id_param;
END;
$$;

-- Function to check if user can create a new story
CREATE OR REPLACE FUNCTION public.can_create_story(user_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_month TEXT;
  stories_this_month INTEGER;
  story_limit INTEGER;
BEGIN
  current_month := TO_CHAR(NOW(), 'YYYY-MM');
  
  -- Get current month's story count
  SELECT COALESCE(stories_created, 0) INTO stories_this_month
  FROM public.monthly_usage
  WHERE user_id = user_id_param AND month_year = current_month;
  
  -- Get user's story limit
  SELECT stories_per_month INTO story_limit
  FROM public.get_user_limits(user_id_param);
  
  RETURN COALESCE(stories_this_month, 0) < COALESCE(story_limit, 1);
END;
$$;

-- Function to check if user can upload more pages to a story
CREATE OR REPLACE FUNCTION public.can_upload_pages(user_id_param UUID, story_id_param UUID, additional_pages INTEGER DEFAULT 1)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_uploads INTEGER;
  upload_limit INTEGER;
BEGIN
  -- Get current uploads for this story
  SELECT COALESCE(pages_uploaded, 0) INTO current_uploads
  FROM public.usage_tracking
  WHERE user_id = user_id_param AND story_id = story_id_param;
  
  -- Get user's upload limit
  SELECT pages_per_story INTO upload_limit
  FROM public.get_user_limits(user_id_param);
  
  RETURN (COALESCE(current_uploads, 0) + additional_pages) <= COALESCE(upload_limit, 8);
END;
$$;

-- Function to check if user can regenerate pages
CREATE OR REPLACE FUNCTION public.can_regenerate_pages(user_id_param UUID, story_id_param UUID, additional_regens INTEGER DEFAULT 1)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_regens INTEGER;
  regen_limit INTEGER;
BEGIN
  -- Get current regenerations for this story
  SELECT COALESCE(pages_regenerated, 0) INTO current_regens
  FROM public.usage_tracking
  WHERE user_id = user_id_param AND story_id = story_id_param;
  
  -- Get user's regeneration limit
  SELECT regenerations_per_story INTO regen_limit
  FROM public.get_user_limits(user_id_param);
  
  RETURN (COALESCE(current_regens, 0) + additional_regens) <= COALESCE(regen_limit, 1);
END;
$$;
