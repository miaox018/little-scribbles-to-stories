
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, X, AlertCircle, RefreshCw, ZoomIn, ZoomOut, Info } from 'lucide-react';

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
  const [imageLoadDebug, setImageLoadDebug] = useState<any>(null);

  const sortedPages = story.story_pages.sort((a, b) => a.page_number - b.page_number);

  // Debug page count mismatch
  useEffect(() => {
    if (isOpen) {
      console.log('StoryViewer Debug:', {
        storyId: story.id,
        title: story.title,
        totalPagesField: story.total_pages,
        actualPagesCount: story.story_pages?.length || 0,
        sortedPagesCount: sortedPages.length,
        pageNumbers: sortedPages.map(p => p.page_number),
        allPages: story.story_pages
      });
    }
  }, [isOpen, story, sortedPages]);

  const goToNextPage = () => {
    setCurrentPage((prev) => (prev + 1) % sortedPages.length);
    setImageError(null);
    setRetryCount(0);
    setIsZoomed(false);
    setImageLoadDebug(null);
  };

  const goToPrevPage = () => {
    setCurrentPage((prev) => (prev - 1 + sortedPages.length) % sortedPages.length);
    setImageError(null);
    setRetryCount(0);
    setIsZoomed(false);
    setImageLoadDebug(null);
  };

  const handleImageLoad = (event: any) => {
    const img = event.target;
    setImageLoadDebug({
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight,
      displayWidth: img.width,
      displayHeight: img.displayHeight,
      src: img.src,
      complete: img.complete
    });
    console.log('Image loaded successfully:', {
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight,
      src: img.src,
      pageNumber: sortedPages[currentPage]?.page_number
    });
    setImageError(null);
    setRetryCount(0);
  };

  const handleImageError = (error: any) => {
    console.error('Image loading error:', error);
    const currentPageData = sortedPages[currentPage];
    const imageUrl = showOriginal ? currentPageData?.original_image_url : currentPageData?.generated_image_url;
    
    console.log('Image error details:', {
      imageUrl,
      pageNumber: currentPageData?.page_number,
      showOriginal,
      errorEvent: error
    });
    
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
    setImageLoadDebug(null);
  };

  const handleRetry = () => {
    setImageError(null);
    setRetryCount(0);
    setImageLoadDebug(null);
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
          
          {/* Debug info for page count mismatch */}
          {story.total_pages !== sortedPages.length && (
            <div className="flex items-center gap-2 text-sm text-orange-600 bg-orange-50 p-2 rounded">
              <Info className="h-4 w-4" />
              Debug: Expected {story.total_pages} pages, found {sortedPages.length} pages
            </div>
          )}
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
                  {currentPageData.page_number !== currentPage + 1 && (
                    <span className="text-orange-600"> (Page #{currentPageData.page_number})</span>
                  )}
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

            {/* Debug info for current image */}
            {imageLoadDebug && (
              <div className="text-xs text-gray-500 mb-2 p-2 bg-gray-50 rounded">
                Image: {imageLoadDebug.naturalWidth}x{imageLoadDebug.naturalHeight} 
                {imageLoadDebug.naturalWidth < 1000 && (
                  <span className="text-orange-600"> ⚠️ Low resolution detected</span>
                )}
              </div>
            )}

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
                      onLoad={handleImageLoad}
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
              <p className="text-sm text-gray-500 mt-2">
                Story shows {story.total_pages} total pages but {sortedPages.length} pages found.
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
