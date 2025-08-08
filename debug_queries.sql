-- Debug queries for story transformation failures
-- Run these in Supabase Dashboard -> SQL Editor

-- 1. Check recent stories and their status
SELECT 
    id,
    title,
    status,
    total_pages,
    description,
    created_at,
    updated_at,
    created_at::date as creation_date
FROM stories 
WHERE created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC
LIMIT 20;

-- 2. Check story pages with failures
SELECT 
    sp.story_id,
    s.title,
    sp.page_number,
    sp.transformation_status,
    sp.error_message,
    sp.created_at,
    sp.updated_at
FROM story_pages sp
JOIN stories s ON sp.story_id = s.id
WHERE sp.transformation_status = 'failed'
    OR sp.error_message IS NOT NULL
ORDER BY sp.created_at DESC
LIMIT 20;

-- 3. Check stories stuck in processing
SELECT 
    id,
    title,
    status,
    total_pages,
    description,
    created_at,
    updated_at,
    (NOW() - updated_at) as time_stuck
FROM stories 
WHERE status = 'processing'
    AND updated_at < NOW() - INTERVAL '30 minutes'
ORDER BY updated_at DESC;

-- 4. Count pages by status for recent stories
SELECT 
    s.id,
    s.title,
    s.status as story_status,
    COUNT(sp.page_number) as total_pages_attempted,
    COUNT(CASE WHEN sp.transformation_status = 'completed' THEN 1 END) as completed_pages,
    COUNT(CASE WHEN sp.transformation_status = 'failed' THEN 1 END) as failed_pages,
    COUNT(CASE WHEN sp.transformation_status IS NULL THEN 1 END) as not_started_pages
FROM stories s
LEFT JOIN story_pages sp ON s.id = sp.story_id
WHERE s.created_at > NOW() - INTERVAL '24 hours'
GROUP BY s.id, s.title, s.status
ORDER BY s.created_at DESC;

-- 5. Get detailed error messages from failed pages
SELECT 
    sp.story_id,
    s.title,
    sp.page_number,
    sp.error_message,
    sp.transformation_status,
    sp.created_at,
    sp.updated_at
FROM story_pages sp
JOIN stories s ON sp.story_id = s.id
WHERE sp.error_message IS NOT NULL
    AND sp.created_at > NOW() - INTERVAL '24 hours'
ORDER BY sp.created_at DESC;