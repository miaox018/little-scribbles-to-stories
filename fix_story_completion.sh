#!/bin/bash

# 修复故事完成状态和文字格式
source supabase.env

STORY_ID="25f51d5e-8dd5-49a7-bce4-323b13f61036"

echo "🔧 Fixing story completion for: $STORY_ID"

# 1. 更新故事状态为completed
echo "📝 1. Updating story status to completed..."
curl -X PATCH \
  "https://mpmbduoffaldnkhrkxxp.supabase.co/rest/v1/stories?id=eq.$STORY_ID" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1wbWJkdW9mZmFsZG5raHJreHhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1MTc1MDQsImV4cCI6MjA2NjA5MzUwNH0.A2lEnoCvxL8ehRGCwkLtLdHVvB33AlM0oU9NG79EFyE" \
  -d '{"status":"completed","description":"Story completed with 5 pages"}'

echo ""
echo "✅ Story status updated!"
echo ""
echo "🎊 The story should now be visible with text in the frontend!"
echo "📖 Story title: test 11"
echo "📄 Pages completed: 5"
echo "🎭 Character: Rose (girl who forgets things)"
echo "📍 Setting: Mall adventure"