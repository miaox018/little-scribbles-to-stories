-- 检查story_page_jobs队列状态
SELECT 
  story_id,
  page_number,
  status,
  attempts,
  last_error,
  character_version,
  created_at,
  updated_at
FROM story_page_jobs 
WHERE story_id = '25f51d5e-8dd5-49a7-bce4-323b13f61036'
ORDER BY page_number;