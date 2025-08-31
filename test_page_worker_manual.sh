#!/bin/bash

# 手动触发page-worker测试
# 使用方法: 
# 1. 编辑 supabase.env 文件，添加你的 service_role_key
# 2. 运行: source supabase.env && ./test_page_worker_manual.sh

SUPABASE_URL="https://mpmbduoffaldnkhrkxxp.supabase.co"
STORY_ID="25f51d5e-8dd5-49a7-bce4-323b13f61036"

echo "🧪 Testing page-worker for story: $STORY_ID"
echo "📡 Supabase URL: $SUPABASE_URL"

# 尝试自动加载环境变量
if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ] && [ -f "supabase.env" ]; then
    echo "🔄 Loading environment from supabase.env..."
    source supabase.env
fi

if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ Error: SUPABASE_SERVICE_ROLE_KEY environment variable is not set"
    echo ""
    echo "Please:"
    echo "1. Get service role key from: https://supabase.com/dashboard/project/mpmbduoffaldnkhrkxxp/settings/api"
    echo "2. Edit supabase.env file and replace 'your_service_role_key_here' with actual key"
    echo "3. Run: source supabase.env && ./test_page_worker_manual.sh"
    echo ""
    exit 1
fi

echo "🚀 Triggering page-worker..."

curl -X POST \
  "$SUPABASE_URL/functions/v1/page-worker" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"storyId\":\"$STORY_ID\"}" \
  -v

echo ""
echo "✅ Request sent. Check the response above for any errors."