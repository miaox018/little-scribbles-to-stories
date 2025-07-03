
-- Remove the overly permissive "Allow admin assignment" policy
DROP POLICY IF EXISTS "Allow admin assignment" ON public.user_roles;

-- Add proper INSERT policy for coupon redemptions (service role only)
CREATE POLICY "Service role can insert coupon redemptions" 
ON public.coupon_redemptions 
FOR INSERT 
WITH CHECK (auth.role() = 'service_role');

-- Add proper UPDATE policy for coupon redemptions (service role only)
CREATE POLICY "Service role can update coupon redemptions" 
ON public.coupon_redemptions 
FOR UPDATE 
USING (auth.role() = 'service_role');

-- Tighten the coupon_codes policies to be admin-only for modifications
DROP POLICY IF EXISTS "Users can view active coupon codes" ON public.coupon_codes;

CREATE POLICY "Users can view active coupon codes" 
ON public.coupon_codes 
FOR SELECT 
USING (is_active = true AND (valid_until IS NULL OR valid_until > now()));

CREATE POLICY "Admins can manage coupon codes" 
ON public.coupon_codes 
FOR ALL 
USING (is_admin(auth.uid()));

-- Add missing RLS policies for profiles table that were too permissive
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Add service role policies for automated operations
CREATE POLICY "Service role can manage profiles" 
ON public.profiles 
FOR ALL 
USING (auth.role() = 'service_role');
