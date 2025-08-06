-- Phase 1: Database Schema Updates for GPT-4o + GPT-Image-1 Pipeline

-- Create job queue table for background processing
CREATE TABLE IF NOT EXISTS public.story_processing_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  job_type TEXT NOT NULL DEFAULT 'full_story' CHECK (job_type IN ('full_story', 'single_page', 'character_sheet')),
  current_page INTEGER DEFAULT 0,
  total_pages INTEGER DEFAULT 0,
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indices for efficient job polling
CREATE INDEX IF NOT EXISTS idx_story_processing_jobs_status ON public.story_processing_jobs(status);
CREATE INDEX IF NOT EXISTS idx_story_processing_jobs_user_id ON public.story_processing_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_story_processing_jobs_story_id ON public.story_processing_jobs(story_id);
CREATE INDEX IF NOT EXISTS idx_story_processing_jobs_created_at ON public.story_processing_jobs(created_at);

-- Add character sheet and processing fields to stories table
ALTER TABLE public.stories 
ADD COLUMN IF NOT EXISTS character_sheet_url TEXT,
ADD COLUMN IF NOT EXISTS character_descriptions JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS processing_version INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS style_bible JSONB DEFAULT '{}';

-- Add OCR and text preservation fields to story_pages table
ALTER TABLE public.story_pages 
ADD COLUMN IF NOT EXISTS ocr_confidence DECIMAL(3,2) CHECK (ocr_confidence >= 0 AND ocr_confidence <= 1),
ADD COLUMN IF NOT EXISTS original_text TEXT,
ADD COLUMN IF NOT EXISTS final_text TEXT,
ADD COLUMN IF NOT EXISTS analysis_data JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS processing_job_id UUID REFERENCES public.story_processing_jobs(id) ON DELETE SET NULL;

-- Enable RLS on job queue table
ALTER TABLE public.story_processing_jobs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for job queue
CREATE POLICY "Users can view their own jobs" 
ON public.story_processing_jobs 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own jobs" 
ON public.story_processing_jobs 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own jobs" 
ON public.story_processing_jobs 
FOR UPDATE 
USING (user_id = auth.uid());

CREATE POLICY "Service role can manage all jobs" 
ON public.story_processing_jobs 
FOR ALL 
USING (auth.role() = 'service_role');

-- Create function to update job timestamps
CREATE OR REPLACE FUNCTION public.update_job_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates on jobs
CREATE TRIGGER update_story_processing_jobs_updated_at
BEFORE UPDATE ON public.story_processing_jobs
FOR EACH ROW
EXECUTE FUNCTION public.update_job_updated_at_column();

-- Create function to get active jobs for a user
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

-- Enable realtime for job updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.story_processing_jobs;