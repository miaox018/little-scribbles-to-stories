
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Mail, Eye, Loader2 } from "lucide-react";
import { useStories } from "@/hooks/useStories";
import { StoryViewer } from "./StoryViewer";

export function Library() {
  const { stories, isLoading } = useStories();
  const [selectedStory, setSelectedStory] = useState<any>(null);

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Your Story Library</h1>
        <p className="text-gray-600">
          All your transformed storybooks in one magical place. Click to read or share with family and friends.
        </p>
      </div>

      {stories.length === 0 ? (
        <Card className="text-center p-12">
          <CardContent>
            <BookOpen className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No stories yet
            </h3>
            <p className="text-gray-500 mb-6">
              Create your first magical storybook to see it here!
            </p>
            <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
              Create Your First Story
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stories.map((story) => (
            <Card key={story.id} className="hover:shadow-lg transition-shadow cursor-pointer group">
              <CardContent className="p-0">
                <div className="aspect-[3/4] bg-gradient-to-br from-purple-100 to-pink-100 rounded-t-lg flex items-center justify-center relative overflow-hidden">
                  {story.story_pages?.[0]?.generated_image_url ? (
                    <img
                      src={story.story_pages[0].generated_image_url}
                      alt={story.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <BookOpen className="h-16 w-16 text-purple-400" />
                  )}
                  {story.status === 'processing' && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                      <div className="text-white text-center">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                        <p className="text-sm">Processing...</p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-800 mb-1 group-hover:text-purple-600 transition-colors">
                    {story.title}
                  </h3>
                  <p className="text-sm text-gray-500 mb-2">
                    {story.total_pages || story.story_pages?.length || 0} pages • 
                    {story.status === 'completed' ? ' Completed' : ` ${story.status}`} • 
                    Created {new Date(story.created_at).toLocaleDateString()}
                  </p>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                      onClick={() => setSelectedStory(story)}
                      disabled={story.status !== 'completed'}
                    >
                      <Eye className="mr-1 h-3 w-3" />
                      {story.status === 'completed' ? 'Read' : 'Processing'}
                    </Button>
                    <Button size="sm" variant="outline" disabled={story.status !== 'completed'}>
                      <Mail className="mr-1 h-3 w-3" />
                      Share
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedStory && (
        <StoryViewer
          story={selectedStory}
          isOpen={!!selectedStory}
          onClose={() => setSelectedStory(null)}
        />
      )}
    </div>
  );
}
