
import { useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X, Heart, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { StoryStatusBadge } from "./StoryStatusBadge";
import { useSubscription } from "@/hooks/useSubscription";
import { PaywallModal } from "@/components/paywall/PaywallModal";

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
  const [isDialogOpen, setIsDialogOpen] = useState(true); // Add local state for dialog
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
      <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          <DialogTitle className="sr-only">In Progress Story - No Content</DialogTitle>
          <DialogDescription className="sr-only">No pages available to display</DialogDescription>
          <div className="flex items-center justify-center h-96">
            <p className="text-gray-500">No pages to display</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const currentStoryPage = pages[currentPage];

  return (
    <>
      <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="max-w-6xl max-h-[95vh] p-0 overflow-hidden">
          <DialogTitle className="sr-only">{story.title}</DialogTitle>
          <DialogDescription className="sr-only">Story viewer displaying pages of {story.title}</DialogDescription>
          <div className="relative bg-white rounded-lg overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-purple-50 to-pink-50">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-gray-800">{story.title}</h2>
                <StoryStatusBadge status={story.status} />
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleSaveToLibrary}
                  disabled={isSaving}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                >
                  <Heart className="mr-2 h-4 w-4" />
                  {isSaving ? "Saving..." : "Save to Library"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    console.log('🔴 X button clicked - event:', e);
                    console.log('🔴 X button clicked - preventDefault check');
                    e.stopPropagation();
                    handleClose();
                  }}
                  className="h-8 w-8 p-0 hover:bg-gray-100 transition-colors"
                  style={{ pointerEvents: 'auto' }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Regenerate Button for Current Page */}
            {currentStoryPage && (
              <div className="absolute top-20 left-4 z-10">
                <Button
                  onClick={() => handleRegeneratePage(currentStoryPage.id)}
                  size="sm"
                  variant="secondary"
                  className="bg-white/90 hover:bg-white shadow-md"
                >
                  <RotateCcw className="mr-1 h-3 w-3" />
                  Regenerate Page
                </Button>
              </div>
            )}

            {/* Image Display */}
            <div className="relative h-[calc(95vh-200px)] bg-gray-100 flex items-center justify-center overflow-hidden">
              {currentStoryPage?.generated_image_url ? (
                <img
                  src={currentStoryPage.generated_image_url}
                  alt={`Page ${currentPage + 1}`}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    console.log('Generated image failed to load, trying original:', currentStoryPage.original_image_url);
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : currentStoryPage?.original_image_url ? (
                <img
                  src={currentStoryPage.original_image_url}
                  alt={`Page ${currentPage + 1} (Original)`}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-gray-400 text-center">
                  <p>No image available</p>
                </div>
              )}

              {/* Navigation Arrows */}
              {totalPages > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={prevPage}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white shadow-md h-10 w-10 p-0"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={nextPage}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white shadow-md h-10 w-10 p-0"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">
                    Page {currentPage + 1} of {totalPages}
                  </span>
                  {currentStoryPage?.transformation_status && (
                    <StoryStatusBadge status={currentStoryPage.transformation_status} className="text-xs" />
                  )}
                </div>
                
                {/* Page Navigation Dots */}
                {totalPages > 1 && (
                  <div className="flex gap-1">
                    {pages.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentPage(index)}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          index === currentPage ? 'bg-purple-600' : 'bg-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <PaywallModal
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        storyTitle={story.title}
      />
    </>
  );
}
