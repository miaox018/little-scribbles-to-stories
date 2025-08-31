
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { CarouselDialog } from "./story-carousel/CarouselDialog";
import { CarouselHeader } from "./story-carousel/CarouselHeader";
import { CarouselImageDisplay } from "./story-carousel/CarouselImageDisplay";
import { CarouselFooter } from "./story-carousel/CarouselFooter";

interface StoryCarouselProps {
  story: any;
  originalImages?: string[];
  onClose?: () => void;
  onSave?: () => void;
  showSaveButton?: boolean;
  allowRegenerate?: boolean; // New prop to control regenerate functionality
}

export function StoryCarousel({ 
  story, 
  originalImages = [], 
  onClose, 
  onSave, 
  showSaveButton = false,
  allowRegenerate = false 
}: StoryCarouselProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

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
    if (onClose) {
      onClose();
    }
  };

  const handleSaveToLibrary = async () => {
    if (!story?.id) return;
    
    setIsSaving(true);
    try {
      console.log('Saving story to library:', story.id);
      
      // Update story status to 'completed' and mark as saved in description
      const { error } = await supabase
        .from('stories')
        .update({ 
          status: 'completed',
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
    if (!allowRegenerate) return;
    
    setIsRegenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('regenerate-page', {
        body: { 
          pageId, 
          storyId: story.id, 
          artStyle: story.art_style || 'watercolor'
        }
      });

      if (error) throw error;

      toast({
        title: "Page Regenerated! ✨",
        description: "The page has been regenerated successfully!",
      });

      // Call onSave to refresh data if it's available
      if (onSave) {
        onSave();
      }
    } catch (error: any) {
      console.error('Error regenerating page:', error);
      toast({
        title: "Regeneration Failed",
        description: error.message || "Failed to regenerate page. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleToggleView = () => {
    setShowOriginal(!showOriginal);
  };

  if (!story || totalPages === 0) {
    return (
      <CarouselDialog 
        isOpen={true} 
        onOpenChange={handleClose} 
        title="Story Carousel - No Content"
      >
        <div className="flex items-center justify-center h-96">
          <p className="text-gray-500">No pages to display</p>
        </div>
      </CarouselDialog>
    );
  }

  const currentStoryPage = pages[currentPage];



  return (
    <CarouselDialog 
      isOpen={true} 
      onOpenChange={handleClose} 
      title={story.title}
    >
      <CarouselHeader
        title={story.title}
        showSaveButton={showSaveButton}
        isSaving={isSaving}
        onSave={handleSaveToLibrary}
        onClose={handleClose}
      />

      <CarouselImageDisplay
        currentStoryPage={currentStoryPage}
        currentPage={currentPage}
        totalPages={totalPages}
        showOriginal={showOriginal}
        allowRegenerate={allowRegenerate}
        onPrevPage={prevPage}
        onNextPage={nextPage}
        onRegeneratePage={handleRegeneratePage}
        onToggleView={handleToggleView}
      />

      <CarouselFooter
        currentPage={currentPage}
        totalPages={totalPages}
        pages={pages}
        currentStoryPage={currentStoryPage}
        onPageSelect={setCurrentPage}
      />
    </CarouselDialog>
  );
}
