
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, RefreshCw, Save, Eye, Loader2, AlertCircle, X, Trash2, Clock } from "lucide-react";
import { useInProgressStories } from "@/hooks/useInProgressStories";
import { StoryViewer } from "./StoryViewer";
import { PaywallModal } from "@/components/paywall/PaywallModal";
import { CancelStoryDialog } from "./CancelStoryDialog";
import { useSubscription } from "@/hooks/useSubscription";
import { useUsageTracking } from "@/hooks/useUsageTracking";
import { toast } from "@/hooks/use-toast";

export function InProgressStories() {
  const { inProgressStories, isLoading, regeneratePage, saveStoryToLibrary, cancelStory, cancelAllProcessingStories, refetch } = useInProgressStories();
  const { subscription } = useSubscription();
  const { trackPageRegeneration } = useUsageTracking();
  const [selectedStory, setSelectedStory] = useState<any>(null);
  const [regeneratingPages, setRegeneratingPages] = useState<Set<string>>(new Set());
  const [savingStories, setSavingStories] = useState<Set<string>>(new Set());
  const [cancellingStories, setCancellingStories] = useState<Set<string>>(new Set());
  const [paywallStory, setPaywallStory] = useState<any>(null);
  const [cancelDialog, setCancelDialog] = useState<{
    isOpen: boolean;
    storyId?: string;
    storyTitle?: string;
    isBulk?: boolean;
    bulkCount?: number;
  }>({ isOpen: false });

  // Count processing stories
  const processingStories = inProgressStories.filter(story => story.status === 'processing');

  // Auto-refresh for processing stories
  useEffect(() => {
    const hasProcessingStories = inProgressStories.some(story => story.status === 'processing');
    
    if (hasProcessingStories) {
      const interval = setInterval(() => {
        refetch();
      }, 30000); // Refresh every 30 seconds
      
      return () => clearInterval(interval);
    }
  }, [inProgressStories, refetch]);

  const handleRegeneratePage = async (pageId: string, storyId: string, artStyle: string) => {
    // Check if user can regenerate more pages
    const canRegenerate = await trackPageRegeneration(storyId);
    if (!canRegenerate) return;

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

  const handleSaveToLibrary = async (story: any) => {
    // For free users, show paywall
    if (subscription.subscription_tier === 'free') {
      setPaywallStory(story);
      return;
    }

    // For paid users, save directly
    setSavingStories(prev => new Set(prev).add(story.id));
    
    try {
      await saveStoryToLibrary(story.id);
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
        newSet.delete(story.id);
        return newSet;
      });
    }
  };

  const handleCancelStory = (storyId: string, storyTitle: string) => {
    setCancelDialog({
      isOpen: true,
      storyId,
      storyTitle,
      isBulk: false
    });
  };

  const handleBulkCancel = () => {
    setCancelDialog({
      isOpen: true,
      isBulk: true,
      bulkCount: processingStories.length
    });
  };

  const confirmCancel = async () => {
    const { storyId, isBulk } = cancelDialog;
    
    try {
      if (isBulk) {
        const cancelledCount = await cancelAllProcessingStories();
        toast({
          title: "Success",
          description: `Cancelled ${cancelledCount} processing stories`
        });
      } else if (storyId) {
        setCancellingStories(prev => new Set(prev).add(storyId));
        await cancelStory(storyId);
        toast({
          title: "Success",
          description: "Story processing cancelled"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to cancel story processing",
        variant: "destructive"
      });
    } finally {
      if (!isBulk && storyId) {
        setCancellingStories(prev => {
          const newSet = new Set(prev);
          newSet.delete(storyId);
          return newSet;
        });
      }
      setCancelDialog({ isOpen: false });
    }
  };

  const handlePaywallClose = () => {
    setPaywallStory(null);
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

  const getProcessingDuration = (createdAt: string) => {
    const created = new Date(createdAt);
    const now = new Date();
    const diffMs = now.getTime() - created.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 60) {
      return `${diffMins}m`;
    } else {
      const hours = Math.floor(diffMins / 60);
      const remainingMins = diffMins % 60;
      return `${hours}h ${remainingMins}m`;
    }
  };

  const isStuckInProcessing = (story: any) => {
    if (story.status !== 'processing') return false;
    
    const created = new Date(story.created_at);
    const now = new Date();
    const diffMs = now.getTime() - created.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    // Consider stuck if processing for more than 15 minutes
    return diffMins > 15;
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
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Stories In Progress</h1>
          <p className="text-gray-600">
            Review your generated stories, regenerate individual pages, and save completed stories to your library.
          </p>
        </div>
        
        {processingStories.length > 0 && (
          <Button
            variant="destructive"
            size="sm"
            onClick={handleBulkCancel}
            className="flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Cancel All Processing ({processingStories.length})
          </Button>
        )}
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
                      {story.status === 'processing' && (
                        <>
                          <Clock className="h-3 w-3 ml-1" />
                          <span className={isStuckInProcessing(story) ? 'text-red-600 font-semibold' : ''}>
                            {getProcessingDuration(story.created_at)}
                            {isStuckInProcessing(story) && ' (STUCK)'}
                          </span>
                        </>
                      )}
                    </span> • 
                    Created {new Date(story.created_at).toLocaleDateString()}
                  </p>
                  {story.description && (
                    <p className="text-xs text-gray-400 mb-2">
                      {story.description}
                    </p>
                  )}
                  {isStuckInProcessing(story) && (
                    <div className="bg-red-50 border border-red-200 rounded p-2 mb-2">
                      <p className="text-red-700 text-xs">
                        ⚠️ This story appears to be stuck in processing. Consider canceling it and trying again.
                      </p>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  {story.status === 'processing' && (
                    <Button 
                      size="sm" 
                      variant={isStuckInProcessing(story) ? "destructive" : "outline"}
                      onClick={() => handleCancelStory(story.id, story.title)}
                      disabled={cancellingStories.has(story.id)}
                    >
                      {cancellingStories.has(story.id) ? (
                        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                      ) : (
                        <X className="mr-1 h-3 w-3" />
                      )}
                      {isStuckInProcessing(story) ? 'Force Cancel' : 'Cancel'}
                    </Button>
                  )}
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
                    onClick={() => handleSaveToLibrary(story)}
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

      {paywallStory && (
        <PaywallModal
          isOpen={!!paywallStory}
          onClose={handlePaywallClose}
          storyTitle={paywallStory.title}
        />
      )}

      <CancelStoryDialog
        isOpen={cancelDialog.isOpen}
        onClose={() => setCancelDialog({ isOpen: false })}
        onConfirm={confirmCancel}
        storyTitle={cancelDialog.storyTitle}
        isBulk={cancelDialog.isBulk}
        bulkCount={cancelDialog.bulkCount}
      />
    </div>
  );
}
