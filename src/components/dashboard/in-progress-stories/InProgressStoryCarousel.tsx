
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
  const [regeneratingPageId, setRegeneratingPageId] = useState<string | null>(null);
  const { subscription } = useSubscription();

  // Ensure story_pages is always an array and sort by page_number
  const pages = (story?.story_pages || []).sort((a: any, b: any) => a.page_number - b.page_number);
  const totalPages = pages.length;

  // Check if regeneration is allowed (only for in-progress stories)
  const allowRegeneration = story?.status === 'processing' || story?.status === 'completed' || story?.status === 'partial';

  // 🐛 DEBUG: Add debug logging for pages data
  console.log('🐛 DEBUG - InProgressStoryCarousel - story prop:', story);
  console.log('🐛 DEBUG - InProgressStoryCarousel - story.story_pages:', story?.story_pages);
  console.log('🐛 DEBUG - InProgressStoryCarousel - pages array:', pages);
  console.log('🐛 DEBUG - InProgressStoryCarousel - totalPages:', totalPages);
  console.log('🐛 DEBUG - InProgressStoryCarousel - allowRegeneration:', allowRegeneration);
  
  if (story?.story_pages) {
    console.log('🐛 DEBUG - story_pages details:', story.story_pages.map((page: any) => ({
      id: page.id,
      page_number: page.page_number,
      has_generated_image: !!page.generated_image_url,
      has_original_image: !!page.original_image_url,
      transformation_status: page.transformation_status
    })));
  }

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
    
    // Immediate feedback
    toast({
      title: "Request Received 🎨",
      description: "Your page regeneration request has been received. Please be patient while we generate your new page with improved character consistency.",
    });
    
    setRegeneratingPageId(pageId);
    
    try {
      if (onRegenerate) {
        await onRegenerate(pageId);
        toast({
          title: "Page Regenerated! ✨",
          description: "Your page has been successfully regenerated with improved character consistency.",
        });
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

  if (!story || totalPages === 0) {
    console.log('🐛 DEBUG - Showing "No pages to display" because:');
    console.log('- story exists:', !!story);
    console.log('- totalPages:', totalPages);
    console.log('- story.story_pages:', story?.story_pages);
    
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
        storyTitle={story.title}
      />
    </>
  );
}
