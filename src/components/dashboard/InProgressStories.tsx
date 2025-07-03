import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useInProgressStories } from "@/hooks/useInProgressStories";
import { StoryViewer } from "./StoryViewer";
import { PaywallModal } from "@/components/paywall/PaywallModal";
import { CancelStoryDialog } from "./CancelStoryDialog";
import { useSubscription } from "@/hooks/useSubscription";
import { useUsageTracking } from "@/hooks/useUsageTracking";
import { toast } from "@/hooks/use-toast";
import { InProgressStoriesHeader } from "./in-progress-stories/InProgressStoriesHeader";
import { EmptyState } from "./in-progress-stories/EmptyState";
import { InProgressStoryCarousel } from "./in-progress-stories/InProgressStoryCarousel";

export function InProgressStories() {
  const { inProgressStories, isLoading, regeneratePage, saveStoryToLibrary, cancelStory, cancelAllProcessingStories, refetch } = useInProgressStories();
  const { subscription } = useSubscription();
  const { trackPageRegeneration } = useUsageTracking();
  const [selectedStory, setSelectedStory] = useState<any>(null);
  const [showCarousel, setShowCarousel] = useState(false);
  const [userClosedCarousel, setUserClosedCarousel] = useState(false);
  const [regeneratingPages, setRegeneratingPages] = useState<Set<string>>(new Set());
  const [savingStory, setSavingStory] = useState(false);
  const [cancellingStories, setCancellingStories] = useState<Set<string>>(new Set());
  const [paywallStory, setPaywallStory] = useState<any>(null);
  const [cancelDialog, setCancelDialog] = useState<{
    isOpen: boolean;
    storyId?: string;
    storyTitle?: string;
    isBulk?: boolean;
    bulkCount?: number;
  }>({ isOpen: false });

  // Get the first (and should be only) in-progress story
  const currentStory = inProgressStories[0] || null;
  const processingStories = inProgressStories.filter(story => story.status === 'processing');

  // Auto-show carousel when story is available (only if user hasn't closed it)
  useEffect(() => {
    console.log('🔴 InProgressStories - currentStory changed:', !!currentStory);
    console.log('🔴 InProgressStories - userClosedCarousel:', userClosedCarousel);
    
    if (currentStory && !userClosedCarousel) {
      console.log('🔴 Setting showCarousel to true (auto-show)');
      setShowCarousel(true);
    }
    
    // Reset user closed flag when a new story arrives
    if (currentStory) {
      setUserClosedCarousel(false);
    }
  }, [currentStory]); // Removed showCarousel from dependencies to prevent loop

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

  const handleCloseCarousel = () => {
    console.log('🔴 InProgressStories handleCloseCarousel called');
    setShowCarousel(false);
    setUserClosedCarousel(true); // Mark that user explicitly closed it
  };

  const handleRegeneratePage = async (pageId: string) => {
    if (!currentStory) return;
    
    // Check if user can regenerate more pages
    const canRegenerate = await trackPageRegeneration(currentStory.id);
    if (!canRegenerate) return;

    setRegeneratingPages(prev => new Set(prev).add(pageId));
    
    try {
      await regeneratePage(pageId, currentStory.id, currentStory.art_style || 'watercolor');
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
    setSavingStory(true);
    
    try {
      await saveStoryToLibrary(story.id);
      toast({
        title: "Success",
        description: "Story saved to library!"
      });
      // Close carousel after successful save
      setShowCarousel(false);
    } catch (error) {
      toast({
        title: "Error", 
        description: "Failed to save story. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSavingStory(false);
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

  console.log('🔴 InProgressStories render - showCarousel:', showCarousel);
  console.log('🔴 InProgressStories render - currentStory exists:', !!currentStory);

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <InProgressStoriesHeader 
        processingCount={processingStories.length}
        onBulkCancel={handleBulkCancel}
      />

      {!currentStory ? (
        <EmptyState />
      ) : (
        <>
          {/* Show carousel only when showCarousel is true */}
          {showCarousel && (
            <InProgressStoryCarousel
              story={currentStory}
              onClose={handleCloseCarousel}
              onRegenerate={handleRegeneratePage}
              onSave={() => handleSaveToLibrary(currentStory)}
            />
          )}

          {/* Show story card/preview when carousel is closed */}
          {!showCarousel && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">{currentStory.title}</h3>
                <Button
                  onClick={() => {
                    setShowCarousel(true);
                    setUserClosedCarousel(false); // Reset when user manually opens
                  }}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  View Story
                </Button>
              </div>
              <p className="text-gray-600 text-sm">
                Status: <span className="capitalize">{currentStory.status}</span>
              </p>
              <p className="text-gray-600 text-sm">
                Pages: {currentStory.story_pages?.length || 0}
              </p>
            </div>
          )}
        </>
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
