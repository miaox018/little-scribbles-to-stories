
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface CancelStoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  storyTitle?: string;
  isBulk?: boolean;
  bulkCount?: number;
}

export function CancelStoryDialog({ 
  isOpen, 
  onClose, 
  onConfirm, 
  storyTitle, 
  isBulk = false,
  bulkCount = 0
}: CancelStoryDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isBulk ? `Cancel ${bulkCount} Processing Stories` : 'Cancel Story Processing'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isBulk 
              ? `Are you sure you want to cancel all ${bulkCount} processing stories? This action cannot be undone and will stop all current transformations.`
              : `Are you sure you want to cancel the processing of "${storyTitle}"? This action cannot be undone and will stop the current transformation.`
            }
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep Processing</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {isBulk ? `Cancel All ${bulkCount} Stories` : 'Cancel Story'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
