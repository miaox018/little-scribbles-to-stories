
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { CarouselImageControls } from "./CarouselImageControls";

interface StoryPage {
  id: string;
  page_number: number;
  original_image_url: string | null;
  generated_image_url: string | null;
  transformation_status: string | null;
}

interface CarouselImageDisplayProps {
  currentStoryPage: StoryPage;
  currentPage: number;
  totalPages: number;
  onPrevPage: () => void;
  onNextPage: () => void;
  onRegeneratePage: () => void;
  allowRegeneration: boolean;
  isRegenerating: boolean;
}

export function CarouselImageDisplay({
  currentStoryPage,
  currentPage,
  totalPages,
  onPrevPage,
  onNextPage,
  onRegeneratePage,
  allowRegeneration,
  isRegenerating
}: CarouselImageDisplayProps) {
  const [showOriginal, setShowOriginal] = useState(false);

  const handleToggleView = () => {
    setShowOriginal(!showOriginal);
  };

  // Determine which image to show
  const imageUrl = showOriginal ? currentStoryPage?.original_image_url : currentStoryPage?.generated_image_url;

  return (
    <div className="flex-1 relative bg-gradient-to-br from-purple-50 to-pink-50">
      {/* Image display area */}
      <div className="h-full flex items-center justify-center p-8">
        <div className="relative max-w-2xl max-h-full">
          {imageUrl ? (
            <>
              <img
                src={imageUrl}
                alt={`Page ${currentStoryPage?.page_number || currentPage + 1}`}
                className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
              />
              
              {/* Image type indicator */}
              <div className="absolute top-2 right-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
                {showOriginal ? 'Original Photo' : 'Enhanced Image'}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-96 w-96 bg-gray-100 rounded-lg">
              <p className="text-gray-500">No image available</p>
            </div>
          )}
        </div>
      </div>

      {/* Toggle controls */}
      <CarouselImageControls
        currentStoryPage={currentStoryPage}
        showOriginal={showOriginal}
        onToggleView={handleToggleView}
      />

      {/* Navigation arrows */}
      {totalPages > 1 && (
        <>
          <Button
            variant="secondary"
            size="icon"
            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white shadow-lg hover:bg-gray-50"
            onClick={onPrevPage}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <Button
            variant="secondary"
            size="icon"
            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white shadow-lg hover:bg-gray-50"
            onClick={onNextPage}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </>
      )}

      {/* Regenerate button (only for stories in progress) */}
      {allowRegeneration && (
        <div className="absolute bottom-4 right-4">
          <Button
            onClick={onRegeneratePage}
            disabled={isRegenerating}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            {isRegenerating ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Regenerating...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Regenerate Page
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
