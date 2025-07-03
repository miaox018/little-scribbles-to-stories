
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface ConfirmNewStoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  inProgressCount: number;
}

export function ConfirmNewStoryDialog({
  isOpen,
  onClose,
  onConfirm,
  inProgressCount
}: ConfirmNewStoryDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Start New Story?
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-gray-600 mb-4">
            You have {inProgressCount} story{inProgressCount > 1 ? 'ies' : ''} in progress that haven't been saved to your library.
          </p>
          <p className="text-gray-600">
            Starting a new story will delete your unsaved work. Are you sure you want to proceed?
          </p>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onConfirm} className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
            Proceed
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
