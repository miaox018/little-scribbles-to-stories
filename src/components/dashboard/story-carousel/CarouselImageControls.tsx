
import { Button } from '@/components/ui/button';
import { Camera, Sparkles } from 'lucide-react';

interface StoryPage {
  id: string;
  page_number: number;
  original_image_url: string | null;
  generated_image_url: string | null;
  transformation_status: string | null;
}

interface CarouselImageControlsProps {
  currentStoryPage: StoryPage;
  showOriginal: boolean;
  onToggleView: () => void;
}

export function CarouselImageControls({ 
  currentStoryPage, 
  showOriginal, 
  onToggleView 
}: CarouselImageControlsProps) {
  const hasOriginal = currentStoryPage?.original_image_url;
  const hasGenerated = currentStoryPage?.generated_image_url;
  const canToggle = hasOriginal && hasGenerated;

  if (!canToggle) {
    return null;
  }

  return (
    <div className="absolute top-4 left-4 z-10">
      <Button
        variant="secondary"
        size="sm"
        onClick={onToggleView}
        className="bg-black bg-opacity-60 text-white hover:bg-opacity-80 border-0"
      >
        {showOriginal ? (
          <>
            <Sparkles className="h-4 w-4 mr-2" />
            Show Enhanced
          </>
        ) : (
          <>
            <Camera className="h-4 w-4 mr-2" />
            Show Original
          </>
        )}
      </Button>
    </div>
  );
}
