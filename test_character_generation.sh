#!/bin/bash

# 测试角色表生成API调用
source supabase.env

echo "🧪 Testing character sheet generation API..."

# 使用Rose故事的第一页图片进行测试
IMAGE_URL="https://mpmbduoffaldnkhrkxxp.supabase.co/storage/v1/object/public/story-images/2542f7c3-ef8d-4219-8916-39f3b1ba5785/temp/25f51d5e-8dd5-49a7-bce4-323b13f61036/page_1_1755646323470.jpeg"

echo "📸 Testing with image: $IMAGE_URL"
echo ""

# 测试GPT-4o视觉分析 (角色表生成使用的API)
echo "🔍 Testing GPT-4o vision analysis..."

curl -X POST \
  "https://api.openai.com/v1/chat/completions" \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4o",
    "messages": [
      {
        "role": "user",
        "content": [
          {
            "type": "text",
            "text": "Analyze this child'\''s drawing to create a detailed character description. Return a JSON object with character_name, physical_description, clothing_details, key_identifying_features, color_palette, age_appearance, species_type, personality_hints, and quality_score."
          },
          {
            "type": "image_url",
            "image_url": {
              "url": "'$IMAGE_URL'"
            }
          }
        ]
      }
    ],
    "max_tokens": 1200
  }' \
  -w "\n\nResponse Status: %{http_code}\n"

echo ""
echo ""

# 测试GPT Image 1生成
echo "🎨 Testing GPT Image 1 generation..."

curl -X POST \
  "https://api.openai.com/v1/images/generations" \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-image-1",
    "prompt": "A friendly child character in a simple cartoon style",
    "size": "1024x1536",
    "quality": "medium",
    "n": 1
  }' \
  -w "\n\nResponse Status: %{http_code}\n"