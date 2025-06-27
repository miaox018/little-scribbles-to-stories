
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, RefreshCw, Save, Eye, Loader2, AlertCircle } from "lucide-react";
import { useInProgressStories } from "@/hooks/useInProgressStories";
import { StoryViewer } from "./StoryViewer";
import { toast } from "@/hooks/use-toast";

export function InProgressStories() {
  const { inProgressStories, isLoading, regeneratePage, saveStoryToLibrary } = useInProgressStories();
  const [selectedStory, setSelectedStory] = useState<any>(null);
  const [regeneratingPages, setRegeneratingPages] = useState<Set<string>>(new Set());
  const [savingStories, setSavingStories] = useState<Set<string>>(new Set());

  const handleRegeneratePage = async (pageId: string, storyId: string, artStyle: string) => {
    setRegeneratingPages(prev => new Set(prev).add(pageId));
    
    try {
      await regeneratePage(pageId, storyId, artStyle);
      toast({
        title: "Success",
        description: "Page regenerated successfully!"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to regenerate page. Please try again.",
        variant: "destructive"
      });
    } finally {
      setRegeneratingPages(prev => {
        const newSet = new Set(prev);
        newSet.delete(pageId);
        return newSet;
      });
    }
  };

  const handleSaveToLibrary = async (storyId: string) => {
    setSavingStories(prev => new Set(prev).add(storyId));
    
    try {
      await saveStoryToLibrary(storyId);
      toast({
        title: "Success",
        description: "Story saved to library!"
      });
    } catch (error) {
      toast({
        title: "Error", 
        description: "Failed to save story. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSavingStories(prev => {
        const newSet = new Set(prev);
        newSet.delete(storyId);
        return newSet;
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'partial': return 'text-yellow-600';
      case 'processing': return 'text-blue-600';
      case 'failed': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processing': return <Loader2 className="h-3 w-3 animate-spin" />;
      case 'failed': return <AlertCircle className="h-3 w-3" />;
      case 'partial': return <AlertCircle className="h-3 w-3" />;
      default: return null;
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
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Stories In Progress</h1>
        <p className="text-gray-600">
          Review your generated stories, regenerate individual pages, and save completed stories to your library.
        </p>
      </div>

      {inProgressStories.length === 0 ? (
        <Card className="text-center p-12">
          <CardContent>
            <BookOpen className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No stories in progress
            </h3>
            <p className="text-gray-500 mb-6">
              Create your first story to see it here for review and editing!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {inProgressStories.map((story) => (
            <Card key={story.id} className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-1">
                    {story.title}
                  </h3>
                  <p className="text-sm text-gray-500 mb-2">
                    {story.total_pages || story.story_pages?.length || 0} pages • 
                    <span className={`inline-flex items-center gap-1 ml-1 ${getStatusColor(story.status)}`}>
                      {getStatusIcon(story.status)}
                      {story.status}
                    </span> • 
                    Created {new Date(story.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setSelectedStory(story)}
                    disabled={story.status === 'processing'}
                  >
                    <Eye className="mr-1 h-3 w-3" />
                    Preview
                  </Button>
                  <Button 
                    size="sm" 
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    onClick={() => handleSaveToLibrary(story.id)}
                    disabled={story.status === 'processing' || savingStories.has(story.id)}
                  >
                    {savingStories.has(story.id) ? (
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    ) : (
                      <Save className="mr-1 h-3 w-3" />
                    )}
                    Save to Library
                  </Button>
                </div>
              </div>

              {/* Pages Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {story.story_pages?.sort((a: any, b: any) => a.page_number - b.page_number).map((page: any) => (
                  <div 
                    key={page.id}
                    className="relative group"
                  >
                    <div className="aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200">
                      {page.generated_image_url ? (
                        <img 
                          src={page.generated_image_url}
                          alt={`Page ${page.page_number}`}
                          className="w-full h-full object-cover"
                          style={{ transform: 'scale(0.5)', transformOrigin: 'center' }}
                        />
                      ) : page.transformation_status === 'failed' ? (
                        <div className="w-full h-full flex items-center justify-center bg-red-50">
                          <AlertCircle className="h-8 w-8 text-red-400" />
                        </div>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Loader2 className="h-8 w-8 text-gray-400 animate-spin" />
                        </div>
                      )}
                    </div>
                    
                    <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                      {page.page_number}
                    </div>

                    {page.transformation_status === 'failed' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                        onClick={() => handleRegeneratePage(page.id, story.id, story.art_style)}
                        disabled={regeneratingPages.has(page.id)}
                      >
                        {regeneratingPages.has(page.id) ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <RefreshCw className="h-3 w-3" />
                        )}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
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
