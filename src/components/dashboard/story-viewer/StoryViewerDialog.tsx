
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { AlertCircle } from 'lucide-react';

interface StoryViewerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  hasPages: boolean;
}

export function StoryViewerDialog({ isOpen, onClose, children, hasPages }: StoryViewerDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-6xl w-[98vw] h-[98vh] max-h-screen p-0 overflow-hidden"
        hideCloseButton={true}
      >
        <div className="flex flex-col h-full">
          {hasPages ? (
            children
          ) : (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No pages available for this story.</p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
