
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { X, GripVertical } from "lucide-react";

interface DraggableImageListProps {
  images: File[];
  onReorder: (newOrder: File[]) => void;
  onRemove: (index: number) => void;
}

export function DraggableImageList({ images, onReorder, onRemove }: DraggableImageListProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      return;
    }

    const newImages = [...images];
    const draggedImage = newImages[draggedIndex];
    
    // Remove the dragged image
    newImages.splice(draggedIndex, 1);
    
    // Insert at new position
    newImages.splice(dropIndex, 0, draggedImage);
    
    onReorder(newImages);
    setDraggedIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  if (images.length === 0) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {images.map((file, index) => (
        <div
          key={`${file.name}-${index}`}
          draggable
          onDragStart={(e) => handleDragStart(e, index)}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, index)}
          onDragEnd={handleDragEnd}
          className={`relative group cursor-move border-2 rounded-lg transition-all ${
            draggedIndex === index ? 'opacity-50 border-purple-400' : 'border-gray-200 hover:border-purple-300'
          }`}
        >
          <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <GripVertical className="h-3 w-3" />
          </div>
          
          <img
            src={URL.createObjectURL(file)}
            alt={`Page ${index + 1}`}
            className="w-full h-32 object-cover rounded-lg"
          />
          
          <Button
            onClick={() => onRemove(index)}
            className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity p-0"
          >
            <X className="h-3 w-3" />
          </Button>
          
          <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
            Page {index + 1}
          </div>
        </div>
      ))}
    </div>
  );
}
