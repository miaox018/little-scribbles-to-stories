
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { StoryViewer } from '@/components/dashboard/StoryViewer';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export default function SharedStory() {
  const { storyId } = useParams<{ storyId: string }>();
  const [showViewer, setShowViewer] = useState(false);

  const { data: story, isLoading, error } = useQuery({
    queryKey: ['shared-story', storyId],
    queryFn: async () => {
      if (!storyId) throw new Error('Story ID is required');

      console.log('🔍 Fetching shared story via Edge Function:', storyId);

      // Make a direct HTTP request to the edge function with the storyId as a URL parameter
      const response = await fetch(
        `https://mpmbduoffaldnkhrkxxp.supabase.co/functions/v1/get-shared-story?storyId=${encodeURIComponent(storyId)}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1wbWJkdW9mZmFsZG5raHJreHhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1MTc1MDQsImV4cCI6MjA2NjA5MzUwNH0.A2lEnoCvxL8ehRGCwkLtLdHVvB33AlM0oU9NG79EFyE`,
            'Content-Type': 'application/json',
          }
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to fetch story' }));
        console.error('❌ Error fetching story via Edge Function:', errorData);
        throw new Error(errorData.error || 'Failed to fetch story');
      }

      const data = await response.json();

      if (!data) {
        throw new Error('Story not found');
      }

      console.log('✅ Story fetched successfully via Edge Function:', data.title);
      return data;
    },
    enabled: !!storyId,
    retry: 1,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading magical story...</p>
        </div>
      </div>
    );
  }

  if (error || !story) {
    console.error('❌ Story loading failed:', error);
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Story Not Found</h1>
          <p className="text-gray-600 mb-6">
            This story link may be invalid, the story may have been removed, or you may not have permission to view it.
          </p>
          <Button 
            onClick={() => window.location.href = '/'}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go to StoryMagic
          </Button>
        </div>
      </div>
    );
  }

  const sortedPages = story.story_pages?.sort((a: any, b: any) => a.page_number - b.page_number) || [];
  console.log('📖 Story pages:', sortedPages.length);

  if (showViewer && sortedPages.length > 0) {
    return (
      <StoryViewer
        story={story}
        isOpen={true}
        onClose={() => setShowViewer(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-purple-600 mb-2">✨ StoryMagic</h1>
          <p className="text-gray-600">Transform children's drawings into magical storybooks</p>
        </div>

        {/* Story Card */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Story Header */}
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6">
            <h2 className="text-2xl font-bold mb-2">{story.title}</h2>
            <p className="opacity-90">
              {sortedPages.length} magical page{sortedPages.length !== 1 ? 's' : ''} • 
              Art Style: {story.art_style?.replace('_', ' ') || 'Classic Watercolor'}
            </p>
          </div>

          {/* Story Preview */}
          <div className="p-6">
            {sortedPages.length > 0 ? (
              <>
                {/* Story Pages with Text */}
                <div className="space-y-8 mb-6">
                  {sortedPages.slice(0, 8).map((page: any) => (
                    <div key={page.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                      {/* Page Header */}
                      <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3">
                        <h3 className="text-lg font-semibold">Page {page.page_number}</h3>
                      </div>
                      
                      <div className="p-6">
                        {/* Image */}
                        <div className="mb-6 flex justify-center">
                          <div className="max-w-md">
                            {page.generated_image_url ? (
                              <img
                                src={page.generated_image_url}
                                alt={`Page ${page.page_number}`}
                                className="w-full h-auto rounded-lg shadow-md"
                                onError={(e) => {
                                  console.log('❌ Image failed to load:', page.generated_image_url);
                                  // Try original image as fallback
                                  if (page.original_image_url && e.currentTarget.src !== page.original_image_url) {
                                    e.currentTarget.src = page.original_image_url;
                                  }
                                }}
                              />
                            ) : page.original_image_url ? (
                              <img
                                src={page.original_image_url}
                                alt={`Page ${page.page_number}`}
                                className="w-full h-auto rounded-lg shadow-md"
                              />
                            ) : (
                              <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                                <span className="text-sm">Page {page.page_number}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Story Text */}
                        {(page.final_text || page.original_text) && (
                          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-100">
                            <p className="text-lg leading-relaxed text-gray-800 font-medium text-center">
                              {page.final_text || page.original_text}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="text-center">
                  <Button
                    onClick={() => setShowViewer(true)}
                    size="lg"
                    className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3"
                  >
                    📖 View Full Story
                  </Button>
                  <p className="text-sm text-gray-600 mt-2">
                    Click to view the complete story with full-size images
                  </p>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">This story doesn't have any pages yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer CTA */}
        <div className="text-center mt-12 p-8 bg-white rounded-lg shadow-lg">
          <h3 className="text-2xl font-bold text-purple-600 mb-4">🎨 Create Your Own Magic</h3>
          <p className="text-gray-600 mb-6">
            Transform your children's drawings into beautiful storybooks with AI magic!
          </p>
          <Button
            onClick={() => window.location.href = '/'}
            size="lg"
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-3"
          >
            Start Creating Stories
          </Button>
        </div>
      </div>
    </div>
  );
}
