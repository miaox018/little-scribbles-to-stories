
import { useStories } from '@/hooks/useStories';
import { useStoryRecovery } from '@/hooks/useStoryRecovery';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Eye, Loader2, AlertTriangle } from 'lucide-react';
import { StoryViewer } from './StoryViewer';
import { useState } from 'react';
import { RecoveryButton } from './RecoveryButton';

export function Library() {
  const { stories, isLoading, refetch } = useStories();
  const [selectedStory, setSelectedStory] = useState<any>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  const handleViewStory = (story: any) => {
    console.log('Opening story:', {
      storyId: story.id,
      title: story.title,
      totalPages: story.total_pages,
      actualPages: story.story_pages?.length || 0,
      pages: story.story_pages
    });
    setSelectedStory(story);
    setIsViewerOpen(true);
  };

  const handleCloseViewer = () => {
    setIsViewerOpen(false);
    setSelectedStory(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading your stories...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Your Story Library</h1>
          <p className="text-gray-600 mt-2">View and manage your transformed stories</p>
        </div>
        <RecoveryButton />
      </div>

      {stories.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">No stories yet</h3>
              <p className="text-gray-600 mb-4">
                Create your first story to see it here
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stories.map((story) => (
            <Card key={story.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{story.title}</CardTitle>
                    <CardDescription className="mt-1">
                      Created {new Date(story.created_at).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <Badge 
                    variant={
                      story.status === 'completed' ? 'default' :
                      story.status === 'processing' ? 'secondary' :
                      story.status === 'failed' ? 'destructive' : 'outline'
                    }
                  >
                    {story.status}
                  </Badge>
                </div>
                
                {/* Debug info for page count mismatch */}
                {story.total_pages !== story.story_pages?.length && (
                  <div className="flex items-center gap-1 text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
                    <AlertTriangle className="h-3 w-3" />
                    Page count mismatch: {story.total_pages} expected, {story.story_pages?.length || 0} actual
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    <div>Pages: {story.story_pages?.length || 0} / {story.total_pages || 0}</div>
                    <div>Style: {story.art_style || 'classic_watercolor'}</div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewStory(story)}
                    disabled={story.status !== 'completed' || !story.story_pages?.length}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedStory && (
        <StoryViewer
          story={selectedStory}
          isOpen={isViewerOpen}
          onClose={handleCloseViewer}
        />
      )}
    </div>
  );
}
