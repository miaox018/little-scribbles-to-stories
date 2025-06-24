
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, X, AlertCircle, RefreshCw, ZoomIn, ZoomOut } from 'lucide-react';

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
  const [imageError, setImageError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);

  const sortedPages = story.story_pages.sort((a, b) => a.page_number - b.page_number);

  const goToNextPage = () => {
    setCurrentPage((prev) => (prev + 1) % sortedPages.length);
    setImageError(null);
    setRetryCount(0);
    setIsZoomed(false);
  };

  const goToPrevPage = () => {
    setCurrentPage((prev) => (prev - 1 + sortedPages.length) % sortedPages.length);
    setImageError(null);
    setRetryCount(0);
    setIsZoomed(false);
  };

  const handleImageError = (error: any) => {
    console.error('Image loading error:', error);
    const currentPageData = sortedPages[currentPage];
    const imageUrl = showOriginal ? currentPageData?.original_image_url : currentPageData?.generated_image_url;
    
    if (imageUrl?.includes('oaidalleapiprodscus.blob.core.windows.net')) {
      setImageError('This image has expired. OpenAI images are only available for 60 minutes. Please regenerate the story to get new images.');
    } else if (imageUrl?.includes('supabase')) {
      setImageError('Failed to load image from storage. The image may have been moved or deleted.');
    } else {
      setImageError('Failed to load image. Please try again or contact support if the problem persists.');
    }
    setRetryCount(prev => prev + 1);
  };

  const handleToggleView = () => {
    setShowOriginal(!showOriginal);
    setImageError(null);
    setRetryCount(0);
  };

  const handleRetry = () => {
    setImageError(null);
    setRetryCount(0);
    // Force image reload by adding a timestamp
    const img = document.querySelector('.story-page-image') as HTMLImageElement;
    if (img && img.src) {
      const url = new URL(img.src);
      url.searchParams.set('retry', Date.now().toString());
      img.src = url.toString();
    }
  };

  const toggleZoom = () => {
    setIsZoomed(!isZoomed);
  };

  const currentPageData = sortedPages[currentPage];
  const currentImageUrl = showOriginal ? currentPageData?.original_image_url : currentPageData?.generated_image_url;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl w-full h-[95vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center justify-between">
            <span>{story.title}</span>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
          <DialogDescription>
            View your enhanced storybook. Use the controls below to navigate between pages and switch between original and enhanced versions.
          </DialogDescription>
        </DialogHeader>

        {sortedPages.length > 0 && currentPageData ? (
          <div className="flex-1 flex flex-col px-6 pb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleToggleView}
                  disabled={!currentPageData.original_image_url || !currentPageData.generated_image_url}
                >
                  {showOriginal ? 'Show Enhanced' : 'Show Original'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleZoom}
                  disabled={!!imageError}
                >
                  {isZoomed ? <ZoomOut className="h-4 w-4" /> : <ZoomIn className="h-4 w-4" />}
                  {isZoomed ? 'Zoom Out' : 'Zoom In'}
                </Button>
                <span className="text-sm text-gray-600">
                  Page {currentPage + 1} of {sortedPages.length}
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

            <div className={`flex-1 flex items-center justify-center bg-gray-50 rounded-lg overflow-auto ${isZoomed ? 'cursor-grab' : ''}`}>
              {imageError ? (
                <div className="text-center p-8 max-w-md">
                  <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4 text-sm">{imageError}</p>
                  <div className="flex gap-2 justify-center">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleRetry}
                      disabled={retryCount >= 3}
                    >
                      <RefreshCw className="h-4 w-4 mr-1" />
                      {retryCount >= 3 ? 'Max retries reached' : 'Try Again'}
                    </Button>
                    {currentPageData.original_image_url && currentPageData.generated_image_url && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={handleToggleView}
                      >
                        Try {showOriginal ? 'Enhanced' : 'Original'}
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                currentImageUrl && (
                  <div className={`transition-all duration-300 ${isZoomed ? 'w-full' : 'max-w-full max-h-full'}`}>
                    <img
                      src={currentImageUrl}
                      alt={`Page ${currentPageData.page_number}`}
                      className={`story-page-image ${
                        isZoomed 
                          ? 'w-full h-auto cursor-grab active:cursor-grabbing' 
                          : 'max-w-full max-h-[60vh] object-contain'
                      }`}
                      onError={handleImageError}
                      onLoad={() => {
                        setImageError(null);
                        setRetryCount(0);
                      }}
                      style={{
                        maxWidth: isZoomed ? 'none' : '100%',
                        maxHeight: isZoomed ? 'none' : '60vh'
                      }}
                    />
                  </div>
                )
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No pages available for this story.</p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
