-- Add phase/resume_at/context/priority to story_page_jobs for agentic flow
ALTER TABLE public.story_page_jobs
ADD COLUMN IF NOT EXISTS phase text DEFAULT 'queued',
ADD COLUMN IF NOT EXISTS resume_at timestamptz NULL,
ADD COLUMN IF NOT EXISTS context jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS priority int DEFAULT 0;

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_jobs_status_resume_at ON public.story_page_jobs(status, resume_at);
CREATE INDEX IF NOT EXISTS idx_jobs_story_status ON public.story_page_jobs(story_id, status);
CREATE INDEX IF NOT EXISTS idx_jobs_story_page_version ON public.story_page_jobs(story_id, page_number, character_version);

-- Optional style prompt on stories
ALTER TABLE public.stories
ADD COLUMN IF NOT EXISTS style_prompt text;
