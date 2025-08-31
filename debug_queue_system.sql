-- Debug Queue System - Comprehensive Check
-- Run this in Supabase SQL Editor to diagnose the issue

-- 1. Check if RPC functions exist
SELECT 
  routine_name, 
  routine_type,
  data_type,
  routine_definition IS NOT NULL as has_definition
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN ('claim_next_story_page_job', 'finish_story_page_job');

-- 2. Check story_page_jobs table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default,
  CASE WHEN column_name IN ('story_id', 'page_number') THEN 'PRIMARY_KEY_COMPONENT' ELSE 'REGULAR' END as key_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'story_page_jobs'
ORDER BY ordinal_position;

-- 3. Check stories table for character_sheet issues
SELECT 
  id, 
  title, 
  character_sheet, 
  character_version,
  CASE 
    WHEN character_sheet IS NULL THEN 'NULL_CHARACTER_SHEET'
    WHEN character_sheet = '{}'::jsonb THEN 'EMPTY_CHARACTER_SHEET'
    WHEN character_sheet = 'null'::jsonb THEN 'NULL_JSON_CHARACTER_SHEET'
    ELSE 'VALID_CHARACTER_SHEET'
  END as character_sheet_status,
  created_at
FROM stories 
ORDER BY created_at DESC 
LIMIT 5;

-- 4. Check recent story_page_jobs
SELECT 
  id,
  story_id,
  page_number,
  status,
  attempts,
  last_error,
  created_at,
  updated_at
FROM story_page_jobs 
ORDER BY created_at DESC 
LIMIT 10;

-- 5. Check if there are any stories with missing character_sheet
SELECT COUNT(*) as stories_without_character_sheet
FROM stories 
WHERE character_sheet IS NULL 
   OR character_sheet = '{}'::jsonb 
   OR character_sheet = 'null'::jsonb;

-- 6. Test the claim function with a sample story
-- (Replace 'your-story-id' with an actual story ID from your database)
-- SELECT * FROM claim_next_story_page_job('your-story-id'::uuid);

-- 7. Check for any constraint violations
SELECT 
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.story_page_jobs'::regclass; 