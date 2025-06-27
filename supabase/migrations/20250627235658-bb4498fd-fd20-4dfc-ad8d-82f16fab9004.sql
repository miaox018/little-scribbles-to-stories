
-- Create an enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create a security definer function to check if a user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create a function to check if user is admin (for easy usage)
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT public.has_role(_user_id, 'admin')
$$;

-- RLS policies for user_roles table
CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles" 
ON public.user_roles 
FOR SELECT 
USING (public.is_admin(auth.uid()));

-- Insert admin role for the specified user (replace with actual user ID after they sign up)
-- This will need to be run manually after getting the user's actual UUID from auth.users

-- Update the usage functions to bypass limits for admins
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
  -- Check if user is admin first
  IF public.is_admin(user_id_param) THEN
    RETURN TRUE;
  END IF;

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

CREATE OR REPLACE FUNCTION public.can_upload_pages(user_id_param UUID, story_id_param UUID, additional_pages INTEGER DEFAULT 1)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_uploads INTEGER;
  upload_limit INTEGER;
BEGIN
  -- Check if user is admin first
  IF public.is_admin(user_id_param) THEN
    RETURN TRUE;
  END IF;

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

CREATE OR REPLACE FUNCTION public.can_regenerate_pages(user_id_param UUID, story_id_param UUID, additional_regens INTEGER DEFAULT 1)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_regens INTEGER;
  regen_limit INTEGER;
BEGIN
  -- Check if user is admin first
  IF public.is_admin(user_id_param) THEN
    RETURN TRUE;
  END IF;

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
