
import { Button } from "@/components/ui/button";
import { X, Heart } from "lucide-react";

interface CarouselHeaderProps {
  title: string;
  showSaveButton?: boolean;
  isSaving?: boolean;
  onSave?: () => void;
  onClose?: () => void;
  statusBadge?: React.ReactNode;
}

export function CarouselHeader({ 
  title, 
  showSaveButton = false, 
  isSaving = false, 
  onSave, 
  onClose,
  statusBadge
}: CarouselHeaderProps) {
  return (
    <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-purple-50 to-pink-50">
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-bold text-gray-800">{title}</h2>
        {statusBadge}
      </div>
      <div className="flex items-center gap-2">
        {showSaveButton && onSave && (
          <Button
            onClick={onSave}
            disabled={isSaving}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
          >
            <Heart className="mr-2 h-4 w-4" />
            {isSaving ? "Saving..." : "Save to Library"}
          </Button>
        )}
        {onClose && (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              console.log('🔴 X button clicked - event:', e);
              console.log('🔴 X button clicked - preventDefault check');
              e.stopPropagation();
              onClose();
            }}
            className="h-8 w-8 p-0 hover:bg-gray-100 transition-colors"
            style={{ pointerEvents: 'auto' }}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
