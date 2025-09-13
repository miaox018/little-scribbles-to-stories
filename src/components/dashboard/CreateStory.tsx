
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StoryTitleInput } from "./create-story/StoryTitleInput";
import { ImageUploadSection } from "./create-story/ImageUploadSection";
import { ArtStyleSelector } from "./ArtStyleSelector";
import { TransformButton } from "./create-story/TransformButton";
import { ErrorDisplay } from "./create-story/ErrorDisplay";
import { SubscriptionInfoCard } from "./create-story/SubscriptionInfoCard";
import { TransformationProgress } from "./TransformationProgress";
import { useStoryTransformation } from "@/hooks/useStoryTransformation";
import { useCredits } from "@/hooks/useCredits";
import { useInProgressStories } from "@/hooks/useInProgressStories";
import { ConfirmNewStoryDialog } from "./create-story/ConfirmNewStoryDialog";
import { CreditPurchaseModal } from "@/components/credits/CreditPurchaseModal";

interface CreateStoryProps {
  onNavigateToInProgress?: () => void;
}

export function CreateStory({ onNavigateToInProgress }: CreateStoryProps) {
  const [title, setTitle] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [artStyle, setArtStyle] = useState("classic_watercolor");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [creditsNeeded, setCreditsNeeded] = useState(0);
  
  const { creditInfo, checkCreditsAvailable, formatCreditsDisplay } = useCredits();
  const { inProgressStories, cancelAllProcessingStories } = useInProgressStories();
  
  const { 
    isTransforming, 
    transformedStory, 
    error, 
    progress, 
    transformStory, 
    resetTransformation 
  } = useStoryTransformation();

  // Check if there are any in-progress stories
  const hasInProgressStories = inProgressStories.length > 0;

  const handleTransform = async () => {
    if (!title.trim() || images.length === 0) return;
    
    // Check if user has enough credits
    const hasEnoughCredits = await checkCreditsAvailable(images.length);
    if (!hasEnoughCredits) {
      setCreditsNeeded(images.length);
      setShowCreditModal(true);
      return;
    }
    
    // Check if there are in-progress stories that need to be handled
    if (hasInProgressStories) {
      setShowConfirmDialog(true);
      return;
    }
    
    await startTransformation();
  };

  const startTransformation = async () => {
    try {
      await transformStory(title, images, artStyle);
      
      // For stories with more than 3 pages, navigate to in-progress tab
      if (images.length > 3 && onNavigateToInProgress) {
        setTimeout(() => {
          onNavigateToInProgress();
        }, 2000);
      }
    } catch (error) {
      console.error('Transform error:', error);
    }
  };

  const handleConfirmNewStory = async () => {
    setShowConfirmDialog(false);
    
    // Cancel all existing in-progress stories
    await cancelAllProcessingStories();
    
    // Start the new transformation
    await startTransformation();
  };

  const handleCancel = () => {
    resetTransformation();
  };

  const handleReset = () => {
    setTitle("");
    setImages([]);
    setArtStyle("classic_watercolor");
    resetTransformation();
  };

  const handleBuyCredits = () => {
    setShowCreditModal(true);
  };

  const isDisabled = !title.trim() || images.length === 0 || isTransforming;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">💎</span>
              <div>
                <CardTitle className="text-lg">Your Credits</CardTitle>
                <CardDescription>
                  {formatCreditsDisplay(creditInfo.remaining_credits)} remaining
                </CardDescription>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">
                {images.length > 0 && `${images.length} pages = ${images.length} credits`}
              </div>
              {creditInfo.remaining_credits < images.length && (
                <div className="text-xs text-red-600 font-medium">
                  Need {images.length - creditInfo.remaining_credits} more credits
                </div>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>
      
      {isTransforming ? (
        <TransformationProgress
          progress={progress}
          storyTitle={title}
          totalPages={images.length}
          onCancel={handleCancel}
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Create Your Story
            </CardTitle>
            <CardDescription>
              Upload your hand-drawn images and we'll transform them into a beautiful illustrated story
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <StoryTitleInput title={title} onTitleChange={setTitle} />
            
            <ImageUploadSection 
              selectedImages={images} 
              onImagesChange={setImages}
              maxPages={99} // No limit with credit system
              subscriptionTier="unlimited"
              isTransforming={isTransforming}
            />
            
            <ArtStyleSelector selectedStyle={artStyle} onStyleChange={setArtStyle} disabled={isTransforming} />
            
            <TransformButton
              isTransforming={isTransforming}
              isDisabled={isDisabled}
              onTransform={handleTransform}
            />
            
            {error && <ErrorDisplay error={error} onRetry={handleReset} />}
          </CardContent>
        </Card>
      )}

      <ConfirmNewStoryDialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={handleConfirmNewStory}
        inProgressCount={inProgressStories.length}
      />

      <CreditPurchaseModal
        isOpen={showCreditModal}
        onClose={() => setShowCreditModal(false)}
        creditsNeeded={creditsNeeded}
        context={`Upload ${images.length} pages for "${title}"`}
      />
    </div>
  );
}
