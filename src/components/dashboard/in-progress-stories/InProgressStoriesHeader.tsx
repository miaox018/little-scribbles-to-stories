
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { useStoryRecovery } from "@/hooks/useStoryRecovery";

interface InProgressStoriesHeaderProps {
  processingCount: number;
  onBulkCancel: () => void;
}

export function InProgressStoriesHeader({ processingCount, onBulkCancel }: InProgressStoriesHeaderProps) {
  const { recoverProcessingStories, isRecovering } = useStoryRecovery();

  return (
    <div className="flex justify-between items-center mb-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Stories In Progress</h2>
        <p className="text-gray-600">
          Manage your stories that are currently being processed or recently completed.
        </p>
      </div>
      
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={recoverProcessingStories}
          disabled={isRecovering}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isRecovering ? 'animate-spin' : ''}`} />
          {isRecovering ? 'Recovering...' : 'Recover Stories'}
        </Button>
        
        {processingCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={onBulkCancel}
            className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <AlertTriangle className="h-4 w-4" />
            Cancel All ({processingCount})
          </Button>
        )}
      </div>
    </div>
  );
}
