
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface StoryPage {
  id: string;
  page_number: number;
  original_image_url: string | null;
  generated_image_url: string | null;
  transformation_status: string | null;
  original_text?: string | null;
  final_text?: string | null;
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

  const storyText = currentPageData.final_text || currentPageData.original_text;

  return (
    <ScrollArea className="h-full">
      <div className="p-4 min-h-full">
        {/* Image Display */}
        <div className="flex justify-center mb-4">
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
        </div>
        
        {/* Story Text Display */}
        {storyText && (
          <div className="mt-6 max-w-2xl mx-auto">
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
              <div className="text-center mb-3">
                <span className="text-sm font-medium text-purple-600 bg-purple-100 px-3 py-1 rounded-full">
                  Page {currentPageData.page_number} Story
                </span>
              </div>
              <p className="text-lg leading-relaxed text-gray-800 font-medium text-center">
                {storyText}
              </p>
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
