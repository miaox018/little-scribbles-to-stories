
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface StoryPage {
  id: string;
  page_number: number;
  original_image_url: string | null;
  generated_image_url: string | null;
  transformation_status: string | null;
}

interface StoryImageDisplayProps {
  currentPageData: StoryPage;
  currentImageUrl: string | null;
  imageError: string | null;
  retryCount: number;
  showOriginal: boolean;
  onImageError: (error: any) => void;
  onImageLoad: () => void;
  onRetry: () => void;
  onToggleView: () => void;
}

export function StoryImageDisplay({
  currentPageData,
  currentImageUrl,
  imageError,
  retryCount,
  showOriginal,
  onImageError,
  onImageLoad,
  onRetry,
  onToggleView
}: StoryImageDisplayProps) {
  if (imageError) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <div className="text-center p-8 max-w-md">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4 text-sm">{imageError}</p>
          <div className="flex gap-2 justify-center">
            <Button 
              variant="outline" 
              size="sm"
              onClick={onRetry}
              disabled={retryCount >= 3}
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              {retryCount >= 3 ? 'Max retries reached' : 'Try Again'}
            </Button>
            {currentPageData.original_image_url && currentPageData.generated_image_url && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={onToggleView}
              >
                Try {showOriginal ? 'Enhanced' : 'Original'}
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!currentImageUrl) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No image available for this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="text-center">
        <img
          src={currentImageUrl}
          alt={`Page ${currentPageData.page_number}`}
          className="max-w-full h-auto story-page-image rounded-lg shadow-sm inline-block"
          onError={onImageError}
          onLoad={onImageLoad}
        />
      </div>
    </div>
  );
}
