#!/bin/bash

# 检查数据库中的队列状态
source supabase.env

STORY_ID="25f51d5e-8dd5-49a7-bce4-323b13f61036"

echo "🔍 Checking database status for story: $STORY_ID"

# 1. 检查story_page_jobs表
echo ""
echo "📋 1. Checking story_page_jobs table..."
curl -X POST \
  "https://mpmbduoffaldnkhrkxxp.supabase.co/rest/v1/rpc/claim_next_story_page_job" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1wbWJkdW9mZmFsZG5raHJreHhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1MTc1MDQsImV4cCI6MjA2NjA5MzUwNH0.A2lEnoCvxL8ehRGCwkLtLdHVvB33AlM0oU9NG79EFyE" \
  -d "{\"input_story_id\":\"$STORY_ID\"}"

echo ""
echo ""

# 2. 直接查询story_page_jobs表
echo "📋 2. Direct query to story_page_jobs..."
curl -X GET \
  "https://mpmbduoffaldnkhrkxxp.supabase.co/rest/v1/story_page_jobs?story_id=eq.$STORY_ID&select=*" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1wbWJkdW9mZmFsZG5raHJreHhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1MTc1MDQsImV4cCI6MjA2NjA5MzUwNH0.A2lEnoCvxL8ehRGCwkLtLdHVvB33AlM0oU9NG79EFyE"

echo ""
echo ""

# 3. 检查stories表的状态
echo "📋 3. Checking stories table..."
curl -X GET \
  "https://mpmbduoffaldnkhrkxxp.supabase.co/rest/v1/stories?id=eq.$STORY_ID&select=id,title,status,character_sheet,character_version,total_pages" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1wbWJkdW9mZmFsZG5raHJreHhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1MTc1MDQsImV4cCI6MjA2NjA5MzUwNH0.A2lEnoCvxL8ehRGCwkLtLdHVvB33AlM0oU9NG79EFyE"

echo ""
echo ""

# 4. 检查story_pages表
echo "📋 4. Checking story_pages table..."
curl -X GET \
  "https://mpmbduoffaldnkhrkxxp.supabase.co/rest/v1/story_pages?story_id=eq.$STORY_ID&select=page_number,transformation_status,original_text,final_text" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1wbWJkdW9mZmFsZG5raHJreHhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1MTc1MDQsImV4cCI6MjA2NjA5MzUwNH0.A2lEnoCvxL8ehRGCwkLtLdHVvB33AlM0oU9NG79EFyE"

echo ""