-- Fix security warnings for new functions by setting proper search paths

-- Update the new trigger function with proper search path
CREATE OR REPLACE FUNCTION public.update_job_updated_at_column()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Update the get_user_active_jobs function with proper search path
CREATE OR REPLACE FUNCTION public.get_user_active_jobs(user_id_param UUID)
RETURNS TABLE(
  job_id UUID,
  story_id UUID,
  story_title TEXT,
  status TEXT,
  progress_percentage INTEGER,
  current_page INTEGER,
  total_pages INTEGER,
  created_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    j.id as job_id,
    j.story_id,
    s.title as story_title,
    j.status,
    j.progress_percentage,
    j.current_page,
    j.total_pages,
    j.created_at,
    j.error_message
  FROM public.story_processing_jobs j
  JOIN public.stories s ON j.story_id = s.id
  WHERE j.user_id = user_id_param
    AND j.status IN ('pending', 'processing')
  ORDER BY j.created_at DESC;
END;
$function$;