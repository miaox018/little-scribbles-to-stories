
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

      // Use the new Edge Function to bypass RLS issues
      const { data, error } = await supabase.functions.invoke('get-shared-story', {
        body: { storyId }
      });

      if (error) {
        console.error('❌ Error fetching story via Edge Function:', error);
        throw new Error(error.message || 'Failed to fetch story');
      }

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
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
                  {sortedPages.slice(0, 8).map((page: any) => (
                    <div key={page.id} className="aspect-square relative bg-gray-100 rounded-lg overflow-hidden">
                      {page.generated_image_url ? (
                        <img
                          src={page.generated_image_url}
                          alt={`Page ${page.page_number}`}
                          className="w-full h-full object-cover"
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
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <span className="text-sm">Page {page.page_number}</span>
                        </div>
                      )}
                      <div className="absolute bottom-1 right-1 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
                        {page.page_number}
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
