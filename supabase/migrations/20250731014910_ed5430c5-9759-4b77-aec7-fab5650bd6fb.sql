-- Update get_user_limits function to provide unlimited access for admins
CREATE OR REPLACE FUNCTION public.get_user_limits(user_id_param uuid)
RETURNS TABLE(subscription_tier text, stories_per_month integer, pages_per_story integer, regenerations_per_story integer)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Check if user is admin first and return unlimited access
  IF public.is_admin(user_id_param) THEN
    RETURN QUERY
    SELECT 
      'admin'::TEXT as subscription_tier,
      999 as stories_per_month,
      999 as pages_per_story,
      999 as regenerations_per_story;
    RETURN;
  END IF;

  -- Regular user limits based on subscription
  RETURN QUERY
  SELECT 
    COALESCE(s.subscription_tier::TEXT, 'free') as subscription_tier,
    CASE 
      WHEN COALESCE(s.subscription_tier::TEXT, 'free') = 'free' THEN 1
      WHEN s.subscription_tier = 'storypro' THEN 5
      WHEN s.subscription_tier = 'storypro_plus' THEN 10
      ELSE 1
    END as stories_per_month,
    CASE 
      WHEN COALESCE(s.subscription_tier::TEXT, 'free') = 'free' THEN 3
      WHEN s.subscription_tier = 'storypro' THEN 12
      WHEN s.subscription_tier = 'storypro_plus' THEN 15
      ELSE 3
    END as pages_per_story,
    CASE 
      WHEN COALESCE(s.subscription_tier::TEXT, 'free') = 'free' THEN 1
      WHEN s.subscription_tier = 'storypro' THEN 3
      WHEN s.subscription_tier = 'storypro_plus' THEN 5
      ELSE 1
    END as regenerations_per_story
  FROM public.subscribers s
  WHERE s.user_id = user_id_param
  
  UNION ALL
  
  -- If no subscriber record exists, return free tier defaults
  SELECT 
    'free'::TEXT as subscription_tier,
    1 as stories_per_month,
    3 as pages_per_story,
    1 as regenerations_per_story
  WHERE NOT EXISTS (
    SELECT 1 FROM public.subscribers WHERE user_id = user_id_param
  );
END;
$function$

-- Update the specific user's subscriber record to admin status
UPDATE public.subscribers 
SET 
  subscribed = false,
  subscription_tier = 'free',
  subscription_end = null,
  updated_at = now()
WHERE email = 'miaox018@gmail.com';