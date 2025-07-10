import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { StoryStatusBadge } from "./StoryStatusBadge";
import { useSubscription } from "@/hooks/useSubscription";
import { PaywallModal } from "@/components/paywall/PaywallModal";
import { CarouselDialog } from "../story-carousel/CarouselDialog";
import { CarouselHeader } from "../story-carousel/CarouselHeader";
import { CarouselImageDisplay } from "../story-carousel/CarouselImageDisplay";
import { CarouselFooter } from "../story-carousel/CarouselFooter";
import { inProgressStoriesService } from "@/services/inProgressStoriesService";

interface InProgressStoryCarouselProps {
  story: any;
  onClose?: () => void;
  onSave?: () => void;
  onRegenerate?: (pageId: string) => void;
}

export function InProgressStoryCarousel({ 
  story, 
  onClose, 
  onSave,
  onRegenerate
}: InProgressStoryCarouselProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [regeneratingPageId, setRegeneratingPageId] = useState<string | null>(null);
  const [storyState, setStoryState] = useState(story);
  const { subscription } = useSubscription();

  // Ensure story_pages is always an array and sort by page_number
  const pages = (storyState?.story_pages || []).sort((a: any, b: any) => a.page_number - b.page_number);
  const totalPages = pages.length;

  // Check if regeneration is allowed (only for in-progress stories, not saved)
  const allowRegeneration = storyState?.status !== 'saved';

  const nextPage = () => {
    setCurrentPage((prev) => (prev + 1) % totalPages);
  };

  const prevPage = () => {
    setCurrentPage((prev) => (prev - 1 + totalPages) % totalPages);
  };

  const handleClose = () => {
    console.log('🔴 InProgressStoryCarousel handleClose called');
    if (onClose) {
      console.log('🔴 Calling onClose callback');
      onClose();
    }
  };

  const handleSaveToLibrary = async () => {
    console.log('💾 Save to library clicked');
    
    if (!storyState?.id) return;
    
    // Check if user has paid subscription
    if (subscription.subscription_tier === 'free') {
      setShowPaywall(true);
      return;
    }
    
    setIsSaving(true);
    try {
      console.log('Saving story to library:', storyState.id);
      
      // First, fetch the latest story data to ensure we have the most current version
      console.log('🔄 Fetching latest story data before saving...');
      const latestStory = await inProgressStoriesService.fetchStoryById(storyState.id);
      
      if (latestStory) {
        console.log('📊 Latest story data fetched, updating local state');
        setStoryState(latestStory);
      }
      
      // Update story status to 'saved' and mark as saved in description
      const { error } = await supabase
        .from('stories')
        .update({ 
          status: 'saved',
          description: 'saved_to_library',
          updated_at: new Date().toISOString()
        })
        .eq('id', storyState.id);

      if (error) {
        console.error('Error saving story:', error);
        throw error;
      }

      toast({
        title: "Story Saved! 📚",
        description: `"${storyState.title}" has been saved to your library with all regenerated pages!`,
      });

      // Close the carousel after saving
      handleClose();

      // Call the onSave callback if provided
      if (onSave) {
        onSave();
      }
    } catch (error: any) {
      console.error('Failed to save story:', error);
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save story. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRegeneratePage = async (pageId: string) => {
    console.log('🔄 Regenerate page clicked for:', pageId);
    
    // Show immediate feedback with improved message
    toast({
      title: "Regenerating Page... 🎨",
      description: "Your page is being regenerated. This may take a moment - please wait for completion.",
    });
    
    setRegeneratingPageId(pageId);
    
    try {
      // Call the regeneration service
      const result = await inProgressStoriesService.regeneratePage(pageId, storyState.id, storyState.art_style || 'classic_watercolor');

      console.log('🎉 Regeneration service response:', result);

      // Fetch the updated story data to get the new image URL
      console.log('🔄 Fetching updated story data after regeneration...');
      const updatedStory = await inProgressStoriesService.fetchStoryById(storyState.id);
      
      if (updatedStory) {
        console.log('📊 Updated story data received, updating UI');
        setStoryState(updatedStory);
        
        // Call the onRegenerate callback if provided
        if (onRegenerate) {
          await onRegenerate(pageId);
        }

        toast({
          title: "Page Regenerated! ✨",
          description: "Your page has been successfully regenerated with improved character consistency.",
        });
      } else {
        throw new Error('Failed to fetch updated story data');
      }
    } catch (error: any) {
      console.error('Regeneration failed:', error);
      toast({
        title: "Regeneration Failed",
        description: error.message || "Failed to regenerate page. Please try again.",
        variant: "destructive"
      });
    } finally {
      setRegeneratingPageId(null);
    }
  };

  // Create a wrapper function for the current page regeneration
  const handleCurrentPageRegenerate = () => {
    if (currentStoryPage?.id) {
      handleRegeneratePage(currentStoryPage.id);
    }
  };

  if (!storyState || totalPages === 0) {
    console.log('🐛 DEBUG - Showing "No pages to display" because:');
    console.log('- story exists:', !!storyState);
    console.log('- totalPages:', totalPages);
    console.log('- story.story_pages:', storyState?.story_pages);
    
    return (
      <CarouselDialog
        isOpen={true}
        onOpenChange={(open) => !open && handleClose()}
        title="In Progress Story - No Content"
      >
        <div className="flex items-center justify-center h-96">
          <p className="text-gray-500">No pages to display</p>
        </div>
      </CarouselDialog>
    );
  }

  const currentStoryPage = pages[currentPage];
  const isCurrentPageRegenerating = regeneratingPageId === currentStoryPage?.id;

  return (
    <>
      <CarouselDialog
        isOpen={true}
        onOpenChange={(open) => !open && handleClose()}
        title={storyState.title}
      >
        <CarouselHeader
          title={storyState.title}
          showSaveButton={true}
          isSaving={isSaving}
          onSave={handleSaveToLibrary}
          onClose={handleClose}
          statusBadge={<StoryStatusBadge status={storyState.status} />}
        />

        <CarouselImageDisplay
          currentStoryPage={currentStoryPage}
          currentPage={currentPage}
          totalPages={totalPages}
          onPrevPage={prevPage}
          onNextPage={nextPage}
          onRegeneratePage={handleCurrentPageRegenerate}
          allowRegeneration={allowRegeneration}
          isRegenerating={isCurrentPageRegenerating}
        />

        <CarouselFooter
          currentPage={currentPage}
          totalPages={totalPages}
          pages={pages}
          currentStoryPage={currentStoryPage}
          onPageSelect={setCurrentPage}
        />
      </CarouselDialog>

      <PaywallModal
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        storyTitle={storyState.title}
      />
    </>
  );
}
