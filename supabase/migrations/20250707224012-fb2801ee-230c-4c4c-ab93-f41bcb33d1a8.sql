
-- Add character summary and meta context version to stories table
ALTER TABLE public.stories 
ADD COLUMN character_summary TEXT,
ADD COLUMN meta_context_version INTEGER DEFAULT 1;

-- Add index for better performance when querying by meta context version
CREATE INDEX idx_stories_meta_context_version ON public.stories(meta_context_version);

-- Update existing stories to have meta_context_version = 1
UPDATE public.stories 
SET meta_context_version = 1 
WHERE meta_context_version IS NULL;
