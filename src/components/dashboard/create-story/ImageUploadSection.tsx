
import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Upload } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { DraggableImageList } from "../DraggableImageList";
import { toast } from "@/hooks/use-toast";

interface ImageUploadSectionProps {
  selectedImages: File[];
  onImagesChange: (images: File[]) => void;
  maxPages: number;
  subscriptionTier: string;
  isTransforming: boolean;
}

export function ImageUploadSection({
  selectedImages,
  onImagesChange,
  maxPages,
  subscriptionTier,
  isTransforming
}: ImageUploadSectionProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length + selectedImages.length > maxPages) {
      toast({
        title: "Too Many Images",
        description: `You can upload a maximum of ${maxPages} images per story with your current plan.`,
        variant: "destructive"
      });
      return;
    }
    
    onImagesChange([...selectedImages, ...acceptedFiles]);
  }, [selectedImages, maxPages, onImagesChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
    },
    maxFiles: maxPages - selectedImages.length,
    disabled: isTransforming || selectedImages.length >= maxPages
  });

  const handleImageReorder = (newOrder: File[]) => {
    onImagesChange(newOrder);
  };

  const removeImage = (index: number) => {
    onImagesChange(selectedImages.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <Label>
        Upload Your Story Images (Max {maxPages} for {subscriptionTier === 'free' ? 'Free' : 'your'} plan)
      </Label>
      
      {selectedImages.length < maxPages && (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive 
              ? "border-purple-400 bg-purple-50" 
              : selectedImages.length >= maxPages
              ? "border-gray-200 bg-gray-50 cursor-not-allowed opacity-50"
              : "border-gray-300 hover:border-purple-400 hover:bg-gray-50"
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          {selectedImages.length >= maxPages ? (
            <div>
              <p className="text-lg mb-2 text-gray-500">
                Maximum images reached ({maxPages})
              </p>
              <p className="text-sm text-gray-400">
                {subscriptionTier === 'free' ? 'Upgrade to upload more images per story' : 'Remove an image to add a new one'}
              </p>
            </div>
          ) : isDragActive ? (
            <p className="text-lg">Drop your images here...</p>
          ) : (
            <div>
              <p className="text-lg mb-2">
                Drag & drop images here, or click to select
              </p>
              <p className="text-sm text-gray-500">
                Supports PNG, JPG, JPEG, GIF, WebP ({maxPages - selectedImages.length} remaining)
              </p>
            </div>
          )}
        </div>
      )}

      <DraggableImageList
        images={selectedImages}
        onReorder={handleImageReorder}
        onRemove={removeImage}
      />
    </div>
  );
}
