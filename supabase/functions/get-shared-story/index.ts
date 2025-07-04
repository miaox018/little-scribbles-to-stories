
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  console.log('🚀 Get shared story function started');
  console.log('Request method:', req.method);
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log('📋 Handling CORS preflight request');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get story ID from URL parameters
    const url = new URL(req.url);
    const storyId = url.searchParams.get('storyId');

    if (!storyId) {
      console.error('❌ No story ID provided');
      return new Response(JSON.stringify({ error: 'Story ID is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('🔍 Fetching story:', storyId);

    // Create Supabase client with service role key for bypassing RLS
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Missing Supabase environment variables');
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch story data using service role (bypasses RLS)
    const { data: story, error } = await supabase
      .from('stories')
      .select(`
        id,
        title,
        art_style,
        total_pages,
        created_at,
        status,
        description,
        cover_image_url,
        story_pages (
          id,
          page_number,
          original_image_url,
          generated_image_url,
          transformation_status
        )
      `)
      .eq('id', storyId)
      .single();

    if (error) {
      console.error('❌ Error fetching story:', error);
      return new Response(JSON.stringify({ error: 'Story not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!story) {
      console.error('❌ Story not found:', storyId);
      return new Response(JSON.stringify({ error: 'Story not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('✅ Story fetched successfully:', story.title);
    
    // Return only public-safe data (no user_id or sensitive info)
    const publicStoryData = {
      id: story.id,
      title: story.title,
      art_style: story.art_style,
      total_pages: story.total_pages,
      created_at: story.created_at,
      status: story.status,
      description: story.description,
      cover_image_url: story.cover_image_url,
      story_pages: story.story_pages || []
    };

    return new Response(JSON.stringify(publicStoryData), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("❌ Unexpected error in get-shared-story function:", error);
    return new Response(JSON.stringify({ 
      error: `Internal server error: ${error.message}` 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

serve(handler);
