
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Scale, RefreshCw, Loader2 } from 'lucide-react';

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
  regeneratingPages: Set<number>;
  onToggleView: () => void;
  onPrevPage: () => void;
  onNextPage: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onRegeneratePage: (pageNumber: number) => void;
}

export function StoryViewerControls({
  currentPage,
  totalPages,
  showOriginal,
  currentPageData,
  currentImageUrl,
  scale,
  regeneratingPages,
  onToggleView,
  onPrevPage,
  onNextPage,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onRegeneratePage
}: StoryViewerControlsProps) {
  const isRegenerating = regeneratingPages.has(currentPageData.page_number);
  const canRegenerate = currentPageData.transformation_status === 'failed' || !currentPageData.generated_image_url;

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 border-b bg-gray-50 flex-shrink-0">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleView}
          disabled={!currentPageData.original_image_url || !currentPageData.generated_image_url}
        >
          {showOriginal ? 'Show Enhanced' : 'Show Original'}
        </Button>
        
        {canRegenerate && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onRegeneratePage(currentPageData.page_number)}
            disabled={isRegenerating}
            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
          >
            {isRegenerating ? (
              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
            ) : (
              <RefreshCw className="mr-1 h-3 w-3" />
            )}
            Regenerate
          </Button>
        )}
        
        <span className="text-sm text-gray-600">
          Page {currentPage + 1} of {totalPages}
        </span>
        
        {currentPageData.transformation_status === 'failed' && (
          <span className="text-xs text-red-600 bg-red-100 px-2 py-1 rounded">
            ⚠️ Page failed to generate
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
            disabled={scale <= 0.3}
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
            disabled={scale >= 2}
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
