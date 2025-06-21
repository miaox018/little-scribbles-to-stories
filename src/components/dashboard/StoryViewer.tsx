
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface StoryPage {
  id: string;
  page_number: number;
  original_image_url: string | null;
  generated_image_url: string | null;
  transformation_status: string | null;
}

interface Story {
  id: string;
  title: string;
  status: string;
  total_pages: number;
  story_pages: StoryPage[];
}

interface StoryViewerProps {
  story: Story;
  isOpen: boolean;
  onClose: () => void;
}

export function StoryViewer({ story, isOpen, onClose }: StoryViewerProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [showOriginal, setShowOriginal] = useState(false);

  const sortedPages = story.story_pages.sort((a, b) => a.page_number - b.page_number);

  const goToNextPage = () => {
    setCurrentPage((prev) => (prev + 1) % sortedPages.length);
  };

  const goToPrevPage = () => {
    setCurrentPage((prev) => (prev - 1 + sortedPages.length) % sortedPages.length);
  };

  const currentPageData = sortedPages[currentPage];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{story.title}</span>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        {sortedPages.length > 0 && currentPageData && (
          <div className="flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowOriginal(!showOriginal)}
                >
                  {showOriginal ? 'Show Enhanced' : 'Show Original'}
                </Button>
                <span className="text-sm text-gray-600">
                  Page {currentPage + 1} of {sortedPages.length}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToPrevPage}
                  disabled={sortedPages.length <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToNextPage}
                  disabled={sortedPages.length <= 1}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex-1 flex items-center justify-center bg-gray-50 rounded-lg overflow-hidden">
              {currentPageData && (
                <img
                  src={showOriginal ? currentPageData.original_image_url || '' : currentPageData.generated_image_url || ''}
                  alt={`Page ${currentPageData.page_number}`}
                  className="max-w-full max-h-full object-contain"
                />
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
