
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wand2 } from "lucide-react";
import { useStoryTransformation } from "@/hooks/useStoryTransformation";
import { StoryCarousel } from "./StoryCarousel";
import { ArtStyleSelector } from "./ArtStyleSelector";
import { TransformationProgress } from "./TransformationProgress";
import { PaywallModal } from "@/components/paywall/PaywallModal";
import { useSubscription } from "@/hooks/useSubscription";
import { toast } from "@/hooks/use-toast";
import { StoryTitleInput } from "./create-story/StoryTitleInput";
import { ImageUploadSection } from "./create-story/ImageUploadSection";
import { TransformButton } from "./create-story/TransformButton";
import { SubscriptionInfoCard } from "./create-story/SubscriptionInfoCard";
import { ErrorDisplay } from "./create-story/ErrorDisplay";

export function CreateStory() {
  const [title, setTitle] = useState("");
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [artStyle, setArtStyle] = useState("classic_watercolor");
  const [showPaywall, setShowPaywall] = useState(false);
  
  const { subscription, limits } = useSubscription();
  const { 
    isTransforming, 
    transformedStory, 
    progress, 
    error, 
    transformStory, 
    resetTransformation 
  } = useStoryTransformation();

  const maxPages = limits?.pages_per_story || 3;

  const handleTransform = async () => {
    if (!title.trim()) {
      toast({
        title: "Title Required",
        description: "Please enter a title for your story.",
        variant: "destructive"
      });
      return;
    }

    if (selectedImages.length === 0) {
      toast({
        title: "Images Required", 
        description: "Please upload at least one image for your story.",
        variant: "destructive"
      });
      return;
    }

    // Check subscription limits
    if (selectedImages.length > maxPages) {
      setShowPaywall(true);
      return;
    }

    try {
      await transformStory(title, selectedImages, artStyle);
    } catch (error) {
      // Error is already handled in the hook
    }
  };

  const handleStartOver = () => {
    resetTransformation();
    setTitle("");
    setSelectedImages([]);
    setArtStyle("classic_watercolor");
  };

  // Show the carousel if story is completed
  if (transformedStory && !isTransforming) {
    const originalImageUrls = selectedImages.map(file => URL.createObjectURL(file));
    
    return (
      <StoryCarousel
        story={transformedStory}
        originalImages={originalImageUrls}
        onSave={handleStartOver}
        showSaveButton={true}
      />
    );
  }

  // Show progress if transforming
  if (isTransforming) {
    return (
      <TransformationProgress
        progress={progress}
        storyTitle={title}
        totalPages={selectedImages.length}
        onCancel={resetTransformation}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="h-6 w-6 text-purple-600" />
            Create Your Magical Story
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <StoryTitleInput title={title} onTitleChange={setTitle} />

          <ImageUploadSection
            selectedImages={selectedImages}
            onImagesChange={setSelectedImages}
            maxPages={maxPages}
            subscriptionTier={subscription.subscription_tier}
            isTransforming={isTransforming}
          />

          <ArtStyleSelector
            selectedStyle={artStyle}
            onStyleChange={setArtStyle}
          />

          <TransformButton
            isTransforming={isTransforming}
            isDisabled={isTransforming || !title.trim() || selectedImages.length === 0}
            onTransform={handleTransform}
          />

          {error && (
            <ErrorDisplay error={error} onRetry={resetTransformation} />
          )}
        </CardContent>
      </Card>

      <SubscriptionInfoCard
        subscriptionTier={subscription.subscription_tier}
        maxPages={maxPages}
      />

      <PaywallModal
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        storyTitle={title}
      />
    </div>
  );
}
