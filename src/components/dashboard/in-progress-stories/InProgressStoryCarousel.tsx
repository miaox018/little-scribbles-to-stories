
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
  const [isDialogOpen, setIsDialogOpen] = useState(true);
  const { subscription } = useSubscription();

  // Ensure story_pages is always an array and sort by page_number
  const pages = (story?.story_pages || []).sort((a: any, b: any) => a.page_number - b.page_number);
  const totalPages = pages.length;

  const nextPage = () => {
    setCurrentPage((prev) => (prev + 1) % totalPages);
  };

  const prevPage = () => {
    setCurrentPage((prev) => (prev - 1 + totalPages) % totalPages);
  };

  const handleClose = () => {
    console.log('🔴 InProgressStoryCarousel handleClose called');
    console.log('🔴 onClose function exists:', !!onClose);
    console.log('🔴 Setting isDialogOpen to false');
    
    setIsDialogOpen(false);
    
    if (onClose) {
      console.log('🔴 Calling onClose callback');
      onClose();
    } else {
      console.log('🔴 No onClose callback provided');
    }
  };

  const handleDialogOpenChange = (open: boolean) => {
    console.log('🔴 Dialog onOpenChange called with:', open);
    if (!open) {
      handleClose();
    }
  };

  const handleSaveToLibrary = async () => {
    console.log('💾 Save to library clicked');
    
    if (!story?.id) return;
    
    // Check if user has paid subscription
    if (subscription.subscription_tier === 'free') {
      setShowPaywall(true);
      return;
    }
    
    setIsSaving(true);
    try {
      console.log('Saving story to library:', story.id);
      
      // Update story status to 'saved' and mark as saved in description
      const { error } = await supabase
        .from('stories')
        .update({ 
          status: 'saved',
          description: 'saved_to_library',
          updated_at: new Date().toISOString()
        })
        .eq('id', story.id);

      if (error) {
        console.error('Error saving story:', error);
        throw error;
      }

      toast({
        title: "Story Saved! 📚",
        description: `"${story.title}" has been saved to your library!`,
      });

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
    if (onRegenerate) {
      onRegenerate(pageId);
    }
  };

  // Add debug logging for dialog state
  console.log('🔴 InProgressStoryCarousel render - isDialogOpen:', isDialogOpen);
  console.log('🔴 InProgressStoryCarousel render - story exists:', !!story);
  console.log('🔴 InProgressStoryCarousel render - totalPages:', totalPages);

  if (!story || totalPages === 0) {
    return (
      <CarouselDialog
        isOpen={isDialogOpen}
        onOpenChange={handleDialogOpenChange}
        title="In Progress Story - No Content"
      >
        <div className="flex items-center justify-center h-96">
          <p className="text-gray-500">No pages to display</p>
        </div>
      </CarouselDialog>
    );
  }

  const currentStoryPage = pages[currentPage];

  return (
    <>
      <CarouselDialog
        isOpen={isDialogOpen}
        onOpenChange={handleDialogOpenChange}
        title={story.title}
      >
        <CarouselHeader
          title={story.title}
          showSaveButton={true}
          isSaving={isSaving}
          onSave={handleSaveToLibrary}
          onClose={handleClose}
          statusBadge={<StoryStatusBadge status={story.status} />}
        />

        <CarouselImageDisplay
          currentStoryPage={currentStoryPage}
          currentPage={currentPage}
          totalPages={totalPages}
          onPrevPage={prevPage}
          onNextPage={nextPage}
          onRegeneratePage={handleRegeneratePage}
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
        storyTitle={story.title}
      />
    </>
  );
}
