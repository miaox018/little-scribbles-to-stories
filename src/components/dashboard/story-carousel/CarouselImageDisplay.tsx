
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CarouselImageDisplayProps {
  currentPage: any;
  currentPageIndex: number;
  totalPages: number;
  originalImages?: string[];
  onPrevPage: () => void;
  onNextPage: () => void;
}

export function CarouselImageDisplay({ 
  currentPage, 
  currentPageIndex, 
  totalPages, 
  originalImages = [],
  onPrevPage, 
  onNextPage 
}: CarouselImageDisplayProps) {
  return (
    <div className="relative h-[calc(95vh-200px)] bg-gray-100 flex items-center justify-center overflow-hidden">
      {currentPage?.generated_image_url ? (
        <img
          src={currentPage.generated_image_url}
          alt={`Page ${currentPageIndex + 1}`}
          className="w-full h-full object-contain"
          onError={(e) => {
            console.log('Generated image failed to load, trying original:', currentPage.original_image_url);
            e.currentTarget.style.display = 'none';
          }}
        />
      ) : currentPage?.original_image_url ? (
        <img
          src={currentPage.original_image_url}
          alt={`Page ${currentPageIndex + 1} (Original)`}
          className="w-full h-full object-contain"
        />
      ) : originalImages[currentPageIndex] ? (
        <img
          src={originalImages[currentPageIndex]}
          alt={`Page ${currentPageIndex + 1} (Preview)`}
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
  );
}
