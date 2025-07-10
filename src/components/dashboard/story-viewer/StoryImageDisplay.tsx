
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertCircle, RefreshCw, Camera } from 'lucide-react';

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
  scale: number;
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
  scale,
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
                <Camera className="h-4 w-4 mr-1" />
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
          <p className="text-gray-600 mb-2">No image available for this page.</p>
          {currentPageData.original_image_url && !showOriginal && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={onToggleView}
              className="mt-2"
            >
              <Camera className="h-4 w-4 mr-1" />
              View Original Photo
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-4 min-h-full flex justify-center">
        <div className="relative">
          <img
            src={currentImageUrl}
            alt={`Page ${currentPageData.page_number}`}
            className="story-page-image rounded-lg shadow-sm transition-transform duration-200 ease-in-out"
            style={{ 
              transform: `scale(${scale})`,
              transformOrigin: 'center top'
            }}
            onError={onImageError}
            onLoad={onImageLoad}
          />
          
          {/* Image type indicator */}
          <div className="absolute top-2 left-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
            <Camera className="h-3 w-3" />
            {showOriginal ? 'Original Photo' : 'Enhanced Image'}
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}
