
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Mail, Eye, Loader2, Trash2 } from "lucide-react";
import { useStories } from "@/hooks/useStories";
import { StoryCarousel } from "./StoryCarousel";
import { DeleteStoryDialog } from "./DeleteStoryDialog";
import { ShareStoryDialog } from "./ShareStoryDialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface LibraryProps {
  onNavigateToCreate?: () => void;
}

export function Library({ onNavigateToCreate }: LibraryProps) {
  const { stories, isLoading, refetch } = useStories();
  const [selectedStory, setSelectedStory] = useState<any>(null);
  const [storyToDelete, setStoryToDelete] = useState<any>(null);
  const [storyToShare, setStoryToShare] = useState<any>(null);
  const [isDeletingStory, setIsDeletingStory] = useState(false);

  // Filter only saved stories for the library (stories with status 'saved' or description 'saved_to_library')
  const savedStories = stories.filter(story => 
    story.status === 'saved' || story.description === 'saved_to_library'
  );

  console.log('All stories:', stories);
  console.log('Saved stories:', savedStories);

  // Refetch stories when component mounts to ensure fresh data
  useEffect(() => {
    refetch();
  }, [refetch]);

  const handleDeleteStory = async () => {
    if (!storyToDelete) return;
    
    setIsDeletingStory(true);
    try {
      // Delete the story (this will cascade delete story_pages due to foreign key)
      const { error } = await supabase
        .from('stories')
        .delete()
        .eq('id', storyToDelete.id);

      if (error) throw error;

      toast({
        title: "Story Deleted",
        description: `"${storyToDelete.title}" has been deleted successfully.`,
      });

      // Refresh the stories list
      refetch();
      setStoryToDelete(null);
    } catch (error) {
      console.error('Error deleting story:', error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete the story. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsDeletingStory(false);
    }
  };

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
          All your saved storybooks in one magical place. Click to read or share with family and friends.
        </p>
      </div>

      {savedStories.length === 0 ? (
        <Card className="text-center p-12">
          <CardContent>
            <BookOpen className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No saved stories yet
            </h3>
            <p className="text-gray-500 mb-6">
              Create and save your first magical storybook to see it here!
            </p>
            <Button 
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              onClick={onNavigateToCreate}
            >
              Create Your First Story
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {savedStories.map((story) => (
            <Card key={story.id} className="hover:shadow-lg transition-shadow cursor-pointer group">
              <CardContent className="p-0">
                <div className="aspect-[3/4] bg-gradient-to-br from-purple-100 to-pink-100 rounded-t-lg flex items-center justify-center relative overflow-hidden">
                  {story.story_pages?.[0]?.generated_image_url ? (
                    <img
                      src={story.story_pages[0].generated_image_url}
                      alt={story.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.log('Image failed to load:', story.story_pages[0].generated_image_url);
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <BookOpen className="h-16 w-16 text-purple-400" />
                  )}
                  
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      setStoryToDelete(story);
                    }}
                    size="sm"
                    variant="destructive"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-800 mb-1 group-hover:text-purple-600 transition-colors">
                    {story.title}
                  </h3>
                  <p className="text-sm text-gray-500 mb-2">
                    {story.total_pages || story.story_pages?.length || 0} pages • 
                    Created {new Date(story.created_at).toLocaleDateString()}
                  </p>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                      onClick={() => setSelectedStory(story)}
                    >
                      <Eye className="mr-1 h-3 w-3" />
                      Read
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => setStoryToShare(story)}
                    >
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
        <StoryCarousel
          story={selectedStory}
          onClose={() => setSelectedStory(null)}
          showSaveButton={false}
        />
      )}

      <DeleteStoryDialog
        isOpen={!!storyToDelete}
        onClose={() => setStoryToDelete(null)}
        onConfirm={handleDeleteStory}
        storyTitle={storyToDelete?.title || ""}
        isDeleting={isDeletingStory}
      />

      <ShareStoryDialog
        isOpen={!!storyToShare}
        onClose={() => setStoryToShare(null)}
        story={storyToShare}
      />
    </div>
  );
}
