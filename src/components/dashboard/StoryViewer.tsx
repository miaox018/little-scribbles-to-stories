import { useState } from 'react';
import { StoryViewerDialog } from './story-viewer/StoryViewerDialog';
import { StoryViewerHeader } from './story-viewer/StoryViewerHeader';
import { StoryViewerControls } from './story-viewer/StoryViewerControls';
import { StoryImageDisplay } from './story-viewer/StoryImageDisplay';

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
  const [scale, setScale] = useState(0.5); // Default to 50% scale

  const sortedPages = story.story_pages.sort((a, b) => a.page_number - b.page_number);

  const goToNextPage = () => {
    setCurrentPage((prev) => (prev + 1) % sortedPages.length);
    setImageError(null);
    setRetryCount(0);
    setScale(1);
  };

  const goToPrevPage = () => {
    setCurrentPage((prev) => (prev - 1 + sortedPages.length) % sortedPages.length);
    setImageError(null);
    setRetryCount(0);
    setScale(1);
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
    const img = document.querySelector('.story-page-image') as HTMLImageElement;
    if (img && img.src) {
      const url = new URL(img.src);
      url.searchParams.set('retry', Date.now().toString());
      img.src = url.toString();
    }
  };

  const handleImageLoad = () => {
    setImageError(null);
    setRetryCount(0);
  };

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.25, 0.25));
  };

  const handleResetZoom = () => {
    setScale(0.5); // Reset to 50% instead of 100%
  };

  const currentPageData = sortedPages[currentPage];
  const currentImageUrl = showOriginal ? currentPageData?.original_image_url : currentPageData?.generated_image_url;
  const hasPages = sortedPages.length > 0 && !!currentPageData;

  return (
    <StoryViewerDialog isOpen={isOpen} onClose={onClose} hasPages={hasPages}>
      {hasPages && (
        <>
          <StoryViewerHeader title={story.title} onClose={onClose} />
          
          <div className="flex flex-col flex-1 min-h-0">
            <StoryViewerControls
              currentPage={currentPage}
              totalPages={sortedPages.length}
              showOriginal={showOriginal}
              currentPageData={currentPageData}
              currentImageUrl={currentImageUrl}
              scale={scale}
              onToggleView={handleToggleView}
              onPrevPage={goToPrevPage}
              onNextPage={goToNextPage}
              onZoomIn={handleZoomIn}
              onZoomOut={handleZoomOut}
              onResetZoom={handleResetZoom}
            />

            <div className="flex-1 overflow-auto">
              <StoryImageDisplay
                currentPageData={currentPageData}
                currentImageUrl={currentImageUrl}
                imageError={imageError}
                retryCount={retryCount}
                showOriginal={showOriginal}
                scale={scale}
                onImageError={handleImageError}
                onImageLoad={handleImageLoad}
                onRetry={handleRetry}
                onToggleView={handleToggleView}
              />
            </div>
          </div>
        </>
      )}
    </StoryViewerDialog>
  );
}
