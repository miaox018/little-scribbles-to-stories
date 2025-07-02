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

interface CreateStoryProps {
  onNavigateToInProgress?: () => void;
}

export function CreateStory({ onNavigateToInProgress }: CreateStoryProps) {
  const [title, setTitle] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [artStyle, setArtStyle] = useState("classic_watercolor");
  
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
    
    try {
      await transformStory(title, images, artStyle);
      
      // For stories with more than 3 pages, navigate to in-progress tab
      if (images.length > 3 && onNavigateToInProgress) {
        setTimeout(() => {
          onNavigateToInProgress();
        }, 2000); // Give user a moment to see the progress started
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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <SubscriptionInfoCard />
      
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
            <StoryTitleInput value={title} onChange={setTitle} />
            
            <ImageUploadSection 
              images={images} 
              onImagesChange={setImages}
            />
            
            <ArtStyleSelector value={artStyle} onChange={setArtStyle} />
            
            <TransformButton
              title={title}
              images={images}
              isTransforming={isTransforming}
              onTransform={handleTransform}
            />
            
            {error && <ErrorDisplay error={error} onReset={handleReset} />}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
