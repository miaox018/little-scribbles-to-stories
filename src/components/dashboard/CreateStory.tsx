
import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Loader2, Upload, Wand2, FileImage } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { useStoryTransformation } from "@/hooks/useStoryTransformation";
import { StoryCarousel } from "./StoryCarousel";
import { ArtStyleSelector } from "./ArtStyleSelector";
import { TransformationProgress } from "./TransformationProgress";
import { PaywallModal } from "@/components/paywall/PaywallModal";
import { useSubscription } from "@/hooks/useSubscription";
import { toast } from "@/hooks/use-toast";

export function CreateStory() {
  const [title, setTitle] = useState("");
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [artStyle, setArtStyle] = useState("classic_watercolor");
  const [showPaywall, setShowPaywall] = useState(false);
  
  const { subscription } = useSubscription();
  const { 
    isTransforming, 
    transformedStory, 
    progress, 
    error, 
    transformStory, 
    resetTransformation 
  } = useStoryTransformation();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length + selectedImages.length > 10) {
      toast({
        title: "Too Many Images",
        description: "You can upload a maximum of 10 images per story.",
        variant: "destructive"
      });
      return;
    }
    
    setSelectedImages(prev => [...prev, ...acceptedFiles]);
  }, [selectedImages.length]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
    },
    maxFiles: 10 - selectedImages.length,
    disabled: isTransforming
  });

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

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
    if (subscription.subscription_tier === 'free' && selectedImages.length > 3) {
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
          {/* Title Input */}
          <div className="space-y-2">
            <Label htmlFor="title">Story Title</Label>
            <Input
              id="title"
              placeholder="Enter your story title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-lg"
            />
          </div>

          {/* Image Upload */}
          <div className="space-y-4">
            <Label>Upload Your Story Images (Max 10)</Label>
            
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive 
                  ? "border-purple-400 bg-purple-50" 
                  : "border-gray-300 hover:border-purple-400 hover:bg-gray-50"
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              {isDragActive ? (
                <p className="text-lg">Drop your images here...</p>
              ) : (
                <div>
                  <p className="text-lg mb-2">
                    Drag & drop images here, or click to select
                  </p>
                  <p className="text-sm text-gray-500">
                    Supports PNG, JPG, JPEG, GIF, WebP (Max 10 images)
                  </p>
                </div>
              )}
            </div>

            {/* Selected Images Preview */}
            {selectedImages.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {selectedImages.map((file, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`Page ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <button
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                    <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                      Page {index + 1}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Art Style Selection */}
          <ArtStyleSelector
            selectedStyle={artStyle}
            onStyleChange={setArtStyle}
          />

          {/* Transform Button */}
          <Button
            onClick={handleTransform}
            disabled={isTransforming || !title.trim() || selectedImages.length === 0}
            size="lg"
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            {isTransforming ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Transforming Story...
              </>
            ) : (
              <>
                <Wand2 className="h-5 w-5 mr-2" />
                Transform My Story
              </>
            )}
          </Button>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700">{error}</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={resetTransformation}
                className="mt-2"
              >
                Try Again
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Free user info */}
      {subscription.subscription_tier === 'free' && (
        <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
          <CardContent className="p-4">
            <p className="text-sm text-purple-700">
              <strong>Free Plan:</strong> Transform up to 3 pages per story. 
              Upgrade for unlimited pages and advanced features!
            </p>
          </CardContent>
        </Card>
      )}

      {/* Paywall Modal */}
      <PaywallModal
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        storyTitle={title}
      />
    </div>
  );
}
