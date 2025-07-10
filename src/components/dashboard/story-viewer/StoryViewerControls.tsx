
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Scale, Camera, Sparkles } from 'lucide-react';

interface StoryPage {
  id: string;
  page_number: number;
  original_image_url: string | null;
  generated_image_url: string | null;
  transformation_status: string | null;
}

interface StoryViewerControlsProps {
  currentPage: number;
  totalPages: number;
  showOriginal: boolean;
  currentPageData: StoryPage;
  currentImageUrl: string | null;
  scale: number;
  onToggleView: () => void;
  onPrevPage: () => void;
  onNextPage: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
}

export function StoryViewerControls({
  currentPage,
  totalPages,
  showOriginal,
  currentPageData,
  currentImageUrl,
  scale,
  onToggleView,
  onPrevPage,
  onNextPage,
  onZoomIn,
  onZoomOut,
  onResetZoom
}: StoryViewerControlsProps) {
  const hasOriginal = currentPageData.original_image_url;
  const hasGenerated = currentPageData.generated_image_url;
  const canToggle = hasOriginal && hasGenerated;

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 border-b bg-gray-50 flex-shrink-0">
      <div className="flex flex-wrap items-center gap-2">
        {canToggle && (
          <Button
            variant="outline"
            size="sm"
            onClick={onToggleView}
            className="flex items-center gap-2"
          >
            {showOriginal ? (
              <>
                <Sparkles className="h-4 w-4" />
                Show Enhanced
              </>
            ) : (
              <>
                <Camera className="h-4 w-4" />
                Show Original
              </>
            )}
          </Button>
        )}
        
        <span className="text-sm text-gray-600">
          Page {currentPage + 1} of {totalPages}
        </span>
        
        {!canToggle && hasOriginal && !hasGenerated && (
          <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
            Original photo only
          </span>
        )}
        
        {currentImageUrl?.includes('oaidalleapiprodscus.blob.core.windows.net') && (
          <span className="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded">
            ⚠️ Temporary URL - may expire
          </span>
        )}
      </div>
      
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 border rounded-md p-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onZoomOut}
            disabled={scale <= 0.25}
            className="h-7 px-2"
          >
            -
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onResetZoom}
            className="h-7 px-2 min-w-12"
          >
            <Scale className="h-3 w-3 mr-1" />
            {Math.round(scale * 100)}%
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onZoomIn}
            disabled={scale >= 3}
            className="h-7 px-2"
          >
            +
          </Button>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={onPrevPage}
          disabled={totalPages <= 1}
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Previous</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onNextPage}
          disabled={totalPages <= 1}
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
