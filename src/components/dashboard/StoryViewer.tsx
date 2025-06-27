
import { useState } from 'react';
import { StoryViewerDialog } from './story-viewer/StoryViewerDialog';
import { StoryViewerHeader } from './story-viewer/StoryViewerHeader';
import { StoryViewerControls } from './story-viewer/StoryViewerControls';
import { StoryImageDisplay } from './story-viewer/StoryImageDisplay';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

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
  art_style?: string;
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
  const [scale, setScale] = useState(0.8); // Start at 80% to fit better
  const [regeneratingPages, setRegeneratingPages] = useState<Set<number>>(new Set());

  const sortedPages = story.story_pages.sort((a, b) => a.page_number - b.page_number);

  const goToNextPage = () => {
    setCurrentPage((prev) => (prev + 1) % sortedPages.length);
    setImageError(null);
    setRetryCount(0);
  };

  const goToPrevPage = () => {
    setCurrentPage((prev) => (prev - 1 + sortedPages.length) % sortedPages.length);
    setImageError(null);
    setRetryCount(0);
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
    setScale(prev => Math.min(prev + 0.1, 2));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.1, 0.3));
  };

  const handleResetZoom = () => {
    setScale(0.8);
  };

  const handleRegeneratePage = async (pageNumber: number) => {
    setRegeneratingPages(prev => new Set(prev).add(pageNumber));
    
    try {
      // Call edge function to regenerate this specific page
      const { data, error } = await supabase.functions.invoke('regenerate-page', {
        body: {
          storyId: story.id,
          pageNumber: pageNumber,
          artStyle: story.art_style || 'classic_watercolor'
        }
      });

      if (error) throw error;

      toast({
        title: "Page Regenerated",
        description: `Page ${pageNumber} has been regenerated successfully.`,
      });

      // Refresh the page to show updated image
      window.location.reload();
      
    } catch (error) {
      console.error('Error regenerating page:', error);
      toast({
        title: "Regeneration Failed",
        description: `Failed to regenerate page ${pageNumber}. Please try again.`,
        variant: "destructive"
      });
    } finally {
      setRegeneratingPages(prev => {
        const newSet = new Set(prev);
        newSet.delete(pageNumber);
        return newSet;
      });
    }
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
              regeneratingPages={regeneratingPages}
              onToggleView={handleToggleView}
              onPrevPage={goToPrevPage}
              onNextPage={goToNextPage}
              onZoomIn={handleZoomIn}
              onZoomOut={handleZoomOut}
              onResetZoom={handleResetZoom}
              onRegeneratePage={handleRegeneratePage}
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
