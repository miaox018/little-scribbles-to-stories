
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";

interface CarouselImageDisplayProps {
  currentStoryPage: any;
  currentPage: number;
  totalPages: number;
  onPrevPage: () => void;
  onNextPage: () => void;
  onRegeneratePage: (pageId: string) => void;
  allowRegeneration?: boolean; // New prop to control regeneration availability
  isRegenerating?: boolean; // New prop to show loading state
}

export function CarouselImageDisplay({
  currentStoryPage,
  currentPage,
  totalPages,
  onPrevPage,
  onNextPage,
  onRegeneratePage,
  allowRegeneration = false,
  isRegenerating = false
}: CarouselImageDisplayProps) {
  return (
    <>
      {/* Regenerate Button for Current Page - Only show if allowed */}
      {currentStoryPage && allowRegeneration && (
        <div className="absolute top-20 left-4 z-10">
          <Button
            onClick={() => onRegeneratePage(currentStoryPage.id)}
            size="sm"
            variant="secondary"
            className="bg-white/90 hover:bg-white shadow-md"
            disabled={isRegenerating}
          >
            <RotateCcw className={`mr-1 h-3 w-3 ${isRegenerating ? 'animate-spin' : ''}`} />
            {isRegenerating ? 'Regenerating...' : 'Regenerate Page'}
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
              onClick={onPrevPage}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white shadow-md h-10 w-10 p-0"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onNextPage}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white shadow-md h-10 w-10 p-0"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </>
        )}
      </div>
    </>
  );
}
