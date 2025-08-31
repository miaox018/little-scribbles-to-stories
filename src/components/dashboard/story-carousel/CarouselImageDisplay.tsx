
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, RotateCcw, Eye, Camera } from "lucide-react";

interface CarouselImageDisplayProps {
  currentStoryPage: any;
  currentPage: number;
  totalPages: number;
  showOriginal: boolean;
  allowRegenerate?: boolean;
  onPrevPage: () => void;
  onNextPage: () => void;
  onRegeneratePage: (pageId: string) => void;
  onToggleView: () => void;
}

export function CarouselImageDisplay({
  currentStoryPage,
  currentPage,
  totalPages,
  showOriginal,
  allowRegenerate = false,
  onPrevPage,
  onNextPage,
  onRegeneratePage,
  onToggleView
}: CarouselImageDisplayProps) {
  return (
    <>
      {/* Top Controls */}
      {currentStoryPage && (
        <div className="absolute top-20 left-4 z-10 flex gap-2">
          {allowRegenerate && (
            <Button
              onClick={() => onRegeneratePage(currentStoryPage.id)}
              size="sm"
              variant="secondary"
              className="bg-white/90 hover:bg-white shadow-md"
            >
              <RotateCcw className="mr-1 h-3 w-3" />
              Regenerate Page
            </Button>
          )}
          
          {/* Toggle between original and generated images */}
          {currentStoryPage?.original_image_url && currentStoryPage?.generated_image_url && (
            <Button
              onClick={onToggleView}
              size="sm"
              variant="outline"
              className="bg-white/90 hover:bg-white shadow-md"
            >
              {showOriginal ? (
                <>
                  <Eye className="mr-1 h-3 w-3" />
                  Show Enhanced
                </>
              ) : (
                <>
                  <Camera className="mr-1 h-3 w-3" />
                  Show Original
                </>
              )}
            </Button>
          )}
        </div>
      )}

      {/* Image Display */}
      <div className="relative h-[calc(95vh-200px)] bg-gray-100 flex items-center justify-center overflow-hidden">
        {(() => {
          const imageUrl = showOriginal ? currentStoryPage?.original_image_url : currentStoryPage?.generated_image_url;
          const fallbackUrl = showOriginal ? currentStoryPage?.generated_image_url : currentStoryPage?.original_image_url;
          
          if (imageUrl) {
            return (
              <img
                src={imageUrl}
                alt={`Page ${currentPage + 1}${showOriginal ? ' (Original)' : ' (Enhanced)'}`}
                className="w-full h-full object-contain"
                onError={(e) => {
                  console.log(`${showOriginal ? 'Original' : 'Generated'} image failed to load:`, imageUrl);
                  if (fallbackUrl) {
                    console.log('Trying fallback:', fallbackUrl);
                    e.currentTarget.src = fallbackUrl;
                  } else {
                    e.currentTarget.style.display = 'none';
                  }
                }}
              />
            );
          } else if (fallbackUrl) {
            return (
              <img
                src={fallbackUrl}
                alt={`Page ${currentPage + 1}${!showOriginal ? ' (Original)' : ' (Enhanced)'}`}
                className="w-full h-full object-contain"
              />
            );
          } else {
            return (
              <div className="text-gray-400 text-center">
                <p>No image available</p>
              </div>
            );
          }
        })()}

        {/* Image Type Indicator */}
        {currentStoryPage?.original_image_url && currentStoryPage?.generated_image_url && (
          <div className="absolute top-4 right-4 z-10">
            <div className="bg-black/60 text-white text-xs px-3 py-1 rounded-full">
              {showOriginal ? 'Original Drawing' : 'Enhanced Story'}
            </div>
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
