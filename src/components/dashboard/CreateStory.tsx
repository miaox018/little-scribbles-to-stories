
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
import { useSubscription } from "@/hooks/useSubscription";
import { useRealtime } from "@/contexts/RealtimeContext";
import { ConfirmNewStoryDialog } from "./create-story/ConfirmNewStoryDialog";

interface CreateStoryProps {
  onNavigateToInProgress?: () => void;
}

export function CreateStory({ onNavigateToInProgress }: CreateStoryProps) {
  const [title, setTitle] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [artStyle, setArtStyle] = useState("classic_watercolor");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  
  const { subscription, limits, createCheckoutSession } = useSubscription();
  const { refreshInProgressStories } = useRealtime();
  
  const { 
    isTransforming, 
    transformedStory, 
    error, 
    progress, 
    transformStory, 
    resetTransformation 
  } = useStoryTransformation();

  const handleTransform = async () => {
    if (!title.trim() || images.length === 0) return;
    
    await startTransformation();
  };

  const startTransformation = async () => {
    try {
      await transformStory(title, images, artStyle);
      
      // Refresh the in-progress stories via global context
      refreshInProgressStories();
      
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

  const handleCancel = () => {
    resetTransformation();
  };

  const handleReset = () => {
    setTitle("");
    setImages([]);
    setArtStyle("classic_watercolor");
    resetTransformation();
  };

  const handleUpgrade = () => {
    createCheckoutSession('storypro').catch(console.error);
  };

  const isDisabled = !title.trim() || images.length === 0 || isTransforming;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <SubscriptionInfoCard 
        subscriptionTier={limits.subscription_tier}
        maxPages={limits.pages_per_story}
        onUpgradeClick={handleUpgrade}
      />
      
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
              maxPages={limits.pages_per_story}
              subscriptionTier={limits.subscription_tier}
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
        onConfirm={() => {}}
        inProgressCount={0}
      />
    </div>
  );
}
