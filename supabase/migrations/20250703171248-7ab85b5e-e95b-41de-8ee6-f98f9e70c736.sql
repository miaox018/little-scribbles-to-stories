
-- Update the status check constraint to include 'saved' status
ALTER TABLE public.stories 
DROP CONSTRAINT IF EXISTS stories_status_check;

ALTER TABLE public.stories 
ADD CONSTRAINT stories_status_check 
CHECK (status IN ('draft', 'processing', 'completed', 'failed', 'cancelled', 'saved'));
