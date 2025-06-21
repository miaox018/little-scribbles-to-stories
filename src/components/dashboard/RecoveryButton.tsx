
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useStoryRecovery } from "@/hooks/useStoryRecovery";

export function RecoveryButton() {
  const { recoverProcessingStories, isRecovering } = useStoryRecovery();

  return (
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
  );
}
