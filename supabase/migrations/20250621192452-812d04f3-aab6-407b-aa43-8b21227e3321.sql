
-- Add art_style field to stories table
ALTER TABLE public.stories 
ADD COLUMN IF NOT EXISTS art_style TEXT DEFAULT 'classic_watercolor';

-- Add cancelled_at timestamp for tracking cancellations
ALTER TABLE public.stories 
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE;

-- Update the status check constraint to include 'cancelled' status
ALTER TABLE public.stories 
DROP CONSTRAINT IF EXISTS stories_status_check;

ALTER TABLE public.stories 
ADD CONSTRAINT stories_status_check 
CHECK (status IN ('draft', 'processing', 'completed', 'failed', 'cancelled'));
