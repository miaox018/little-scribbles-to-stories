// 手动测试page-worker
const SUPABASE_URL = 'https://mpmbduoffaldnkhrkxxp.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function testPageWorker() {
  const storyId = '25f51d5e-8dd5-49a7-bce4-323b13f61036'; // 从日志中获取
  
  console.log('🧪 Testing page-worker for story:', storyId);
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/page-worker`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ storyId })
    });
    
    const responseText = await response.text();
    console.log('📊 Response status:', response.status);
    console.log('📝 Response body:', responseText);
    
    if (response.ok) {
      console.log('✅ Page worker executed successfully');
    } else {
      console.error('❌ Page worker failed:', responseText);
    }
  } catch (error) {
    console.error('💥 Network error:', error.message);
  }
}

testPageWorker();