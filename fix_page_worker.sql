-- Fix character_sheet for existing stories and provide fallback
-- This ensures the queue system works even with missing character_sheet

-- 1. Update all stories that have NULL or empty character_sheet
UPDATE stories 
SET 
  character_sheet = '{"name": "Default Character", "description": "A friendly character for storytelling", "features": ["kind", "adventurous", "helpful"], "appearance": "friendly and approachable"}'::jsonb,
  character_version = 1
WHERE 
  character_sheet IS NULL 
  OR character_sheet = '{}'::jsonb
  OR character_sheet = 'null'::jsonb;

-- 2. Ensure all stories have character_version set
UPDATE stories 
SET character_version = 1 
WHERE character_version IS NULL;

-- 3. Update story_pages to have character_version
UPDATE story_pages 
SET character_version = s.character_version
FROM stories s
WHERE story_pages.story_id = s.id 
  AND story_pages.character_version IS NULL;

-- 4. Verify the fixes
SELECT 
  'Stories with valid character_sheet' as check_type,
  COUNT(*) as count
FROM stories 
WHERE character_sheet IS NOT NULL 
  AND character_sheet != '{}'::jsonb 
  AND character_sheet != 'null'::jsonb

UNION ALL

SELECT 
  'Stories with character_version' as check_type,
  COUNT(*) as count
FROM stories 
WHERE character_version IS NOT NULL

UNION ALL

SELECT 
  'Story pages with character_version' as check_type,
  COUNT(*) as count
FROM story_pages 
WHERE character_version IS NOT NULL;

-- 5. Check recent stories
SELECT 
  id, 
  title, 
  character_sheet, 
  character_version,
  created_at
FROM stories 
ORDER BY created_at DESC 
LIMIT 3; 