
import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X, Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface StoryCarouselProps {
  story: any;
  originalImages?: string[];
  onClose?: () => void;
  onSave?: () => void;
  showSaveButton?: boolean;
}

export function StoryCarousel({ 
  story, 
  originalImages = [], 
  onClose, 
  onSave, 
  showSaveButton = false 
}: StoryCarouselProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  // Ensure story_pages is always an array and sort by page_number
  const pages = (story?.story_pages || []).sort((a: any, b: any) => a.page_number - b.page_number);
  const totalPages = pages.length;

  const nextPage = () => {
    setCurrentPage((prev) => (prev + 1) % totalPages);
  };

  const prevPage = () => {
    setCurrentPage((prev) => (prev - 1 + totalPages) % totalPages);
  };

  const handleSaveToLibrary = async () => {
    if (!story?.id) return;
    
    setIsSaving(true);
    try {
      console.log('Saving story to library:', story.id);
      
      // Update story status to 'saved'
      const { error } = await supabase
        .from('stories')
        .update({ 
          status: 'saved',
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

  if (!story || totalPages === 0) {
    return (
      <Dialog open={true} onOpenChange={() => onClose?.()}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          <div className="flex items-center justify-center h-96">
            <p className="text-gray-500">No pages to display</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const currentStoryPage = pages[currentPage];

  return (
    <Dialog open={true} onOpenChange={() => onClose?.()}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <div className="relative bg-white rounded-lg overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-purple-50 to-pink-50">
            <h2 className="text-xl font-bold text-gray-800">{story.title}</h2>
            <div className="flex items-center gap-2">
              {showSaveButton && (
                <Button
                  onClick={handleSaveToLibrary}
                  disabled={isSaving}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                >
                  <Heart className="mr-2 h-4 w-4" />
                  {isSaving ? "Saving..." : "Save to Library"}
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onClose?.()}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Image Display */}
          <div className="relative aspect-[3/4] bg-gray-100 flex items-center justify-center">
            {currentStoryPage?.generated_image_url ? (
              <img
                src={currentStoryPage.generated_image_url}
                alt={`Page ${currentPage + 1}`}
                className="max-w-full max-h-full object-contain"
                onError={(e) => {
                  console.log('Generated image failed to load, trying original:', currentStoryPage.original_image_url);
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : currentStoryPage?.original_image_url ? (
              <img
                src={currentStoryPage.original_image_url}
                alt={`Page ${currentPage + 1} (Original)`}
                className="max-w-full max-h-full object-contain"
              />
            ) : originalImages[currentPage] ? (
              <img
                src={originalImages[currentPage]}
                alt={`Page ${currentPage + 1} (Preview)`}
                className="max-w-full max-h-full object-contain"
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
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    currentStoryPage.transformation_status === 'completed' 
                      ? 'bg-green-100 text-green-800' 
                      : currentStoryPage.transformation_status === 'failed'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {currentStoryPage.transformation_status}
                  </span>
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
  );
}
