
-- Update the get_user_limits function to set free plan to 3 pages per story
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
      WHEN s.subscription_tier = 'free' THEN 3
      WHEN s.subscription_tier = 'storypro' THEN 12
      WHEN s.subscription_tier = 'storypro_plus' THEN 15
      ELSE 3
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
