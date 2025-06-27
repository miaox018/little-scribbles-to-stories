
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Mail, Eye, Loader2, X, AlertCircle, Trash2, RefreshCw } from "lucide-react";
import { useStories } from "@/hooks/useStories";
import { StoryViewer } from "./StoryViewer";
import { DeleteStoryDialog } from "./DeleteStoryDialog";
import { ShareStoryDialog } from "./ShareStoryDialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export function Library() {
  const { stories, isLoading, refetch } = useStories();
  const [selectedStory, setSelectedStory] = useState<any>(null);
  const [storyToDelete, setStoryToDelete] = useState<any>(null);
  const [storyToShare, setStoryToShare] = useState<any>(null);
  const [cancellingStories, setCancellingStories] = useState<Set<string>>(new Set());
  const [isDeletingStory, setIsDeletingStory] = useState(false);

  const handleCancelStory = async (storyId: string) => {
    setCancellingStories(prev => new Set(prev).add(storyId));
    
    try {
      // Update story status to cancelled
      const { error } = await supabase
        .from('stories')
        .update({ 
          status: 'cancelled',
          cancelled_at: new Date().toISOString()
        })
        .eq('id', storyId);

      if (error) throw error;

      toast({
        title: "Story Cancelled",
        description: "The story transformation has been cancelled successfully.",
      });

      // Refresh the stories list
      refetch();
    } catch (error) {
      console.error('Error cancelling story:', error);
      toast({
        title: "Error",
        description: "Failed to cancel story transformation",
        variant: "destructive"
      });
    } finally {
      setCancellingStories(prev => {
        const newSet = new Set(prev);
        newSet.delete(storyId);
        return newSet;
      });
    }
  };

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'partial': return 'text-yellow-600';
      case 'processing': return 'text-blue-600';
      case 'failed': return 'text-red-600';
      case 'cancelled': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processing': return <Loader2 className="h-3 w-3 animate-spin" />;
      case 'partial': return <AlertCircle className="h-3 w-3" />;
      case 'failed': case 'cancelled': return <AlertCircle className="h-3 w-3" />;
      default: return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Completed';
      case 'partial': return 'Partially Complete';
      case 'processing': return 'Processing';
      case 'failed': return 'Failed';
      case 'cancelled': return 'Cancelled';
      default: return status;
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
                      onError={(e) => {
                        console.log('Image failed to load:', story.story_pages[0].generated_image_url);
                        // Hide the broken image and show fallback
                        e.currentTarget.style.display = 'none';
                      }}
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
                  {(story.status === 'failed' || story.status === 'cancelled') && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                      <div className="text-white text-center">
                        <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                        <p className="text-sm capitalize">{story.status}</p>
                      </div>
                    </div>
                  )}
                  {story.status === 'partial' && (
                    <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                      <div className="text-white text-center">
                        <AlertCircle className="h-6 w-6 mx-auto mb-1" />
                        <p className="text-xs">Some pages need regeneration</p>
                      </div>
                    </div>
                  )}
                  {/* Delete button overlay */}
                  {story.status !== 'processing' && (
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
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-800 mb-1 group-hover:text-purple-600 transition-colors">
                    {story.title}
                  </h3>
                  <p className="text-sm text-gray-500 mb-2">
                    {story.total_pages || story.story_pages?.length || 0} pages • 
                    <span className={`inline-flex items-center gap-1 ml-1 ${getStatusColor(story.status)}`}>
                      {getStatusIcon(story.status)}
                      {getStatusText(story.status)}
                    </span> • 
                    Created {new Date(story.created_at).toLocaleDateString()}
                  </p>
                  <div className="flex gap-2">
                    {story.status === 'processing' ? (
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                        onClick={() => handleCancelStory(story.id)}
                        disabled={cancellingStories.has(story.id)}
                      >
                        {cancellingStories.has(story.id) ? (
                          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        ) : (
                          <X className="mr-1 h-3 w-3" />
                        )}
                        Cancel
                      </Button>
                    ) : (
                      <>
                        <Button 
                          size="sm" 
                          className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                          onClick={() => setSelectedStory(story)}
                          disabled={story.status === 'failed'}
                        >
                          <Eye className="mr-1 h-3 w-3" />
                          {story.status === 'completed' || story.status === 'partial' ? 'Read' : getStatusText(story.status)}
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          disabled={story.status !== 'completed' && story.status !== 'partial'}
                          onClick={() => setStoryToShare(story)}
                        >
                          <Mail className="mr-1 h-3 w-3" />
                          Share
                        </Button>
                      </>
                    )}
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
