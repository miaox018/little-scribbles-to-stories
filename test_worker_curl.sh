#!/bin/bash

# 测试page-worker函数
# 需要设置SUPABASE_SERVICE_ROLE_KEY环境变量

STORY_ID="25f51d5e-8dd5-49a7-bce4-323b13f61036"
SUPABASE_URL="https://mpmbduoffaldnkhrkxxp.supabase.co"

echo "🧪 Testing page-worker for story: $STORY_ID"
echo "📍 URL: $SUPABASE_URL/functions/v1/page-worker"

if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ SUPABASE_SERVICE_ROLE_KEY environment variable not set"
    echo "💡 Please set it from your Supabase dashboard: Project Settings > API > service_role key"
    exit 1
fi

echo "🔑 Service role key: ${SUPABASE_SERVICE_ROLE_KEY:0:20}..."

curl -X POST "$SUPABASE_URL/functions/v1/page-worker" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"storyId\": \"$STORY_ID\"}" \
  -v

echo ""
echo "✅ Test completed"