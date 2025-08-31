-- Fix character_sheet for existing stories
-- This script ensures all stories have a valid character_sheet

-- Check current state
SELECT 
  id, 
  title, 
  character_sheet, 
  character_version,
  CASE 
    WHEN character_sheet IS NULL OR character_sheet = '{}'::jsonb THEN 'NEEDS_FIX'
    ELSE 'OK'
  END as status
FROM stories 
ORDER BY created_at DESC 
LIMIT 10;

-- Update stories that have NULL or empty character_sheet
UPDATE stories 
SET 
  character_sheet = '{"name": "Default Character", "description": "A friendly character for storytelling", "features": ["kind", "adventurous", "helpful"]}'::jsonb,
  character_version = 1
WHERE 
  character_sheet IS NULL 
  OR character_sheet = '{}'::jsonb
  OR character_sheet = 'null'::jsonb;

-- Verify the fix
SELECT 
  id, 
  title, 
  character_sheet, 
  character_version,
  CASE 
    WHEN character_sheet IS NULL OR character_sheet = '{}'::jsonb THEN 'STILL_NEEDS_FIX'
    ELSE 'FIXED'
  END as status
FROM stories 
ORDER BY created_at DESC 
LIMIT 10;

-- Check if the RPC functions exist
SELECT 
  routine_name, 
  routine_type,
  data_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN ('claim_next_story_page_job', 'finish_story_page_job');

-- Check story_page_jobs table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'story_page_jobs'
ORDER BY ordinal_position; 