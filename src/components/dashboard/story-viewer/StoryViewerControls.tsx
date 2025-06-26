
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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
  onToggleView: () => void;
  onPrevPage: () => void;
  onNextPage: () => void;
}

export function StoryViewerControls({
  currentPage,
  totalPages,
  showOriginal,
  currentPageData,
  currentImageUrl,
  onToggleView,
  onPrevPage,
  onNextPage
}: StoryViewerControlsProps) {
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
        <span className="text-sm text-gray-600">
          Page {currentPage + 1} of {totalPages}
        </span>
        {currentImageUrl?.includes('oaidalleapiprodscus.blob.core.windows.net') && (
          <span className="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded">
            ⚠️ Temporary URL - may expire
          </span>
        )}
      </div>
      
      <div className="flex items-center gap-2">
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
