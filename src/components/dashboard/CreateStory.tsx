
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileImage, GripVertical, Loader2 } from "lucide-react";
import { useStoryTransformation } from "@/hooks/useStoryTransformation";

export function CreateStory() {
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [storyTitle, setStoryTitle] = useState("");
  const { transformStory, isTransforming } = useStoryTransformation();

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type.startsWith('image/')
    );
    setUploadedFiles(prev => [...prev, ...files]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setUploadedFiles(prev => [...prev, ...files]);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleImageDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleImageDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleImageDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) return;

    const newFiles = [...uploadedFiles];
    const draggedFile = newFiles[draggedIndex];
    newFiles.splice(draggedIndex, 1);
    newFiles.splice(dropIndex, 0, draggedFile);
    
    setUploadedFiles(newFiles);
    setDraggedIndex(null);
  };

  const createImageUrl = (file: File) => {
    return URL.createObjectURL(file);
  };

  const handleTransformStory = async () => {
    if (!storyTitle.trim()) {
      alert("Please enter a story title");
      return;
    }
    
    await transformStory(uploadedFiles, storyTitle.trim(), "classic_watercolor");
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Create New Story</h1>
        <p className="text-gray-600">
          Upload your child's hand-drawn story pages to transform them into a beautiful watercolor storybook.
        </p>
      </div>

      {/* Upload Area */}
      <Card className="mb-8">
        <CardContent className="p-8">
          <div
            className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
              dragActive
                ? "border-purple-500 bg-purple-50"
                : "border-gray-300 hover:border-purple-400"
            } ${isTransforming ? "opacity-50 pointer-events-none" : ""}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              Drop your story pages here
            </h3>
            <p className="text-gray-500 mb-6">
              or click to browse and select multiple images
            </p>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
              disabled={isTransforming}
            />
            <label htmlFor="file-upload">
              <Button 
                asChild 
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                disabled={isTransforming}
              >
                <span className="cursor-pointer">
                  <FileImage className="mr-2 h-4 w-4" />
                  Select Images
                </span>
              </Button>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Uploaded Files Preview */}
      {uploadedFiles.length > 0 && (
        <Card className="mb-6">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">
              Uploaded Pages ({uploadedFiles.length})
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Drag and drop images to reorder them
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {uploadedFiles.map((file, index) => (
                <div 
                  key={index} 
                  className={`relative group cursor-move ${isTransforming ? "opacity-50" : ""}`}
                  draggable={!isTransforming}
                  onDragStart={(e) => handleImageDragStart(e, index)}
                  onDragOver={(e) => handleImageDragOver(e, index)}
                  onDrop={(e) => handleImageDrop(e, index)}
                >
                  <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden relative">
                    <img 
                      src={createImageUrl(file)} 
                      alt={`Page ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                      {index + 1}
                    </div>
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <GripVertical className="h-4 w-4 text-white drop-shadow-lg" />
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 mt-1 truncate">{file.name}</p>
                  {!isTransforming && (
                    <button
                      onClick={() => removeFile(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Story Title Input */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <Label htmlFor="story-title" className="text-base font-medium">
            Story Title
          </Label>
          <Input
            id="story-title"
            placeholder="Enter your story title..."
            value={storyTitle}
            onChange={(e) => setStoryTitle(e.target.value)}
            className="mt-2"
            disabled={isTransforming}
          />
        </CardContent>
      </Card>

      {/* Transform Button */}
      {uploadedFiles.length > 0 && (
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="mb-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                🎨 <strong>Art Style:</strong> Classic Watercolor - Your story will be transformed into beautiful, soft watercolor paintings with gentle colors.
              </p>
            </div>
            
            {!isTransforming && (
              <div className="mb-4 p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-green-800">
                  ☕ <strong>Grab a coffee!</strong> The transformation process takes a few minutes to create your beautiful watercolor storybook. Feel free to check back later - we'll have your story ready in your library!
                </p>
              </div>
            )}
            
            <Button 
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              onClick={handleTransformStory}
              disabled={isTransforming || !storyTitle.trim()}
            >
              {isTransforming ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Your Storybook...
                </>
              ) : (
                "Transform Into Watercolor Storybook"
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
