
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { RefreshCw, Save, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { PaywallModal } from '@/components/paywall/PaywallModal';
import { useSubscription } from '@/hooks/useSubscription';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

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

interface StoryCarouselProps {
  story: Story;
  originalImages?: string[]; // URLs of original uploaded images
  onSave?: () => void;
  onRegenerate?: (pageNumber: number) => void;
  onClose?: () => void;
  showSaveButton?: boolean;
  isGenerating?: boolean;
}

export function StoryCarousel({ 
  story, 
  originalImages = [], 
  onSave, 
  onRegenerate, 
  onClose,
  showSaveButton = true,
  isGenerating = false
}: StoryCarouselProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [showOriginals, setShowOriginals] = useState(false);
  const [scale, setScale] = useState(0.75);
  const [showPaywall, setShowPaywall] = useState(false);
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());
  const { subscription } = useSubscription();
  const { user } = useAuth();

  // Persist user's viewing state
  useEffect(() => {
    const savedState = localStorage.getItem(`story-carousel-${story.id}`);
    if (savedState) {
      const { currentPage: savedPage, scale: savedScale, showOriginals: savedShowOriginals } = JSON.parse(savedState);
      setCurrentPage(savedPage || 0);
      setScale(savedScale || 0.75);
      setShowOriginals(savedShowOriginals || false);
    }
  }, [story.id]);

  useEffect(() => {
    localStorage.setItem(`story-carousel-${story.id}`, JSON.stringify({
      currentPage,
      scale,
      showOriginals
    }));
  }, [currentPage, scale, showOriginals, story.id]);

  const sortedPages = story.story_pages.sort((a, b) => a.page_number - b.page_number);
  const displayImages = showOriginals ? originalImages : sortedPages.map(p => p.generated_image_url).filter(Boolean);

  const handleSave = async () => {
    if (!subscription.subscribed && subscription.subscription_tier === 'free') {
      setShowPaywall(true);
      return;
    }
    
    try {
      await supabase
        .from('stories')
        .update({ status: 'saved' })
        .eq('id', story.id);
      
      toast({
        title: "Story Saved! 📚",
        description: "Your masterpiece has been added to your library.",
      });
      
      onSave?.();
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Unable to save your story. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleRegenerate = (pageNumber: number) => {
    if (!subscription.subscribed && subscription.subscription_tier === 'free') {
      setShowPaywall(true);
      return;
    }
    onRegenerate?.(pageNumber);
  };

  const handleImageError = (pageIndex: number) => {
    setImageErrors(prev => new Set([...prev, pageIndex]));
  };

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.25, 2));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.25, 0.25));

  const renderPageCard = (imageUrl: string | null, pageIndex: number) => {
    const hasError = imageErrors.has(pageIndex);
    const isProcessing = !imageUrl && !hasError;
    
    return (
      <Card className="relative h-[600px] w-[400px] mx-auto shadow-2xl rounded-2xl overflow-hidden bg-gradient-to-br from-white to-gray-50 border-0">
        <CardContent className="p-0 h-full flex items-center justify-center">
          {isProcessing ? (
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-purple-600" />
              <p className="text-sm text-gray-600">Crafting page {pageIndex + 1}...</p>
            </div>
          ) : hasError ? (
            <div className="flex flex-col items-center space-y-4 p-6 text-center">
              <AlertCircle className="h-12 w-12 text-red-400" />
              <p className="text-sm text-gray-600">Failed to load page {pageIndex + 1}</p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setImageErrors(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(pageIndex);
                    return newSet;
                  });
                  handleRegenerate(pageIndex + 1);
                }}
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Retry
              </Button>
            </div>
          ) : imageUrl ? (
            <img
              src={imageUrl}
              alt={`Page ${pageIndex + 1}`}
              className="w-full h-full object-contain transition-transform duration-200"
              style={{ transform: `scale(${scale})` }}
              onError={() => handleImageError(pageIndex)}
            />
          ) : (
            <div className="text-gray-400">No image available</div>
          )}
        </CardContent>
        
        {/* Page number indicator */}
        <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white text-xs px-3 py-1 rounded-full">
          {pageIndex + 1} / {displayImages.length}
        </div>
      </Card>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex flex-col items-center justify-center z-50 p-4">
      {/* Header Controls */}
      <div className="w-full max-w-4xl flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold text-white">{story.title}</h2>
          {originalImages.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowOriginals(!showOriginals)}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              {showOriginals ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
              {showOriginals ? 'Show Enhanced' : 'View Originals'}
            </Button>
          )}
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Zoom Controls */}
          <div className="flex items-center space-x-1 bg-white/10 rounded-lg p-1">
            <Button variant="ghost" size="sm" onClick={handleZoomOut} className="text-white hover:bg-white/20">-</Button>
            <span className="text-white text-sm px-2">{Math.round(scale * 100)}%</span>
            <Button variant="ghost" size="sm" onClick={handleZoomIn} className="text-white hover:bg-white/20">+</Button>
          </div>
          
          {/* Regenerate Button */}
          <Button
            onClick={() => handleRegenerate(currentPage + 1)}
            disabled={isGenerating || showOriginals}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Regenerate Page
          </Button>
          
          {onClose && (
            <Button variant="outline" onClick={onClose} className="bg-white/10 border-white/20 text-white hover:bg-white/20">
              ×
            </Button>
          )}
        </div>
      </div>

      {/* Carousel */}
      <div className="flex-1 flex items-center justify-center w-full max-w-5xl">
        <Carousel className="w-full">
          <CarouselContent className="-ml-4">
            {displayImages.map((imageUrl, index) => (
              <CarouselItem key={index} className="pl-4 basis-full flex justify-center">
                {renderPageCard(imageUrl, index)}
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="left-4 bg-white/20 border-white/30 text-white hover:bg-white/30" />
          <CarouselNext className="right-4 bg-white/20 border-white/30 text-white hover:bg-white/30" />
        </Carousel>
      </div>

      {/* Bottom Save Button */}
      {showSaveButton && (
        <div className="w-full max-w-4xl flex justify-center mt-6">
          <Button
            onClick={handleSave}
            size="lg"
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 py-4 text-lg rounded-2xl shadow-2xl"
          >
            <Save className="h-5 w-5 mr-2" />
            Save to Library
          </Button>
        </div>
      )}

      {/* Paywall Modal */}
      <PaywallModal
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        storyTitle={story.title}
      />
    </div>
  );
}
