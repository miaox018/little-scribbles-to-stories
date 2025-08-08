// Test script to diagnose story transformation
// Run this in browser console on your app

async function testTransformation() {
    console.log('🔍 Starting transformation test...');
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        console.error('❌ No authenticated user');
        return;
    }
    console.log('✅ User authenticated:', user.email);
    
    // Check admin status
    const { data: isAdmin } = await supabase.rpc('is_admin', { _user_id: user.id });
    console.log('🔑 Admin status:', isAdmin);
    
    // Check limits
    const { data: canCreate } = await supabase.rpc('can_create_story', { user_id_param: user.id });
    console.log('📝 Can create story:', canCreate);
    
    // Monitor a specific story (replace with actual story ID)
    const storyId = 'YOUR_STORY_ID_HERE';
    
    if (storyId === 'YOUR_STORY_ID_HERE') {
        console.log('⚠️ Please replace YOUR_STORY_ID_HERE with an actual story ID');
        return;
    }
    
    // Watch story progress
    const watchStory = async () => {
        const { data: story } = await supabase
            .from('stories')
            .select('*')
            .eq('id', storyId)
            .single();
            
        console.log('📖 Story status:', {
            id: story?.id,
            status: story?.status,
            description: story?.description,
            total_pages: story?.total_pages,
            updated_at: story?.updated_at
        });
        
        const { data: pages } = await supabase
            .from('story_pages')
            .select('page_number, transformation_status, error_message')
            .eq('story_id', storyId)
            .order('page_number');
            
        console.log('📄 Pages status:', pages);
        
        return story?.status;
    };
    
    // Initial check
    let status = await watchStory();
    
    // Poll every 10 seconds if processing
    if (status === 'processing') {
        console.log('⏱️ Monitoring processing...');
        const interval = setInterval(async () => {
            status = await watchStory();
            if (status !== 'processing') {
                console.log('✅ Processing completed with status:', status);
                clearInterval(interval);
            }
        }, 10000);
        
        // Stop after 10 minutes
        setTimeout(() => {
            clearInterval(interval);
            console.log('⏰ Stopped monitoring after 10 minutes');
        }, 600000);
    }
}

// Usage: 
// 1. Open your app in browser
// 2. Open browser console (F12)
// 3. Paste this script
// 4. Run: testTransformation()

console.log('📋 Test script loaded. Run testTransformation() to start diagnosis.');