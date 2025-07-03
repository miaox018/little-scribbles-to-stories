
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

interface InProgressStoriesHeaderProps {
  processingCount: number;
  onBulkCancel: () => void;
}

export function InProgressStoriesHeader({ processingCount, onBulkCancel }: InProgressStoriesHeaderProps) {
  return (
    <div className="mb-8 flex justify-between items-start">
      <div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Stories In Progress</h1>
        <p className="text-gray-600">
          Review your generated stories, regenerate individual pages, and save completed stories to your library.
        </p>
      </div>
      
      {processingCount > 0 && (
        <Button
          variant="destructive"
          size="sm"
          onClick={onBulkCancel}
          className="flex items-center gap-2"
        >
          <Trash2 className="h-4 w-4" />
          Cancel All Processing ({processingCount})
        </Button>
      )}
    </div>
  );
}
