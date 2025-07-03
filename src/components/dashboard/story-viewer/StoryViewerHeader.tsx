
import { DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface StoryViewerHeaderProps {
  title: string;
  onClose: () => void;
}

export function StoryViewerHeader({ title, onClose }: StoryViewerHeaderProps) {
  return (
    <DialogHeader className="px-4 py-3 border-b flex-shrink-0">
      <div className="flex items-center justify-between">
        <DialogTitle className="truncate pr-4 text-lg">{title}</DialogTitle>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onClose}
          className="h-8 w-8 p-0 hover:bg-gray-100"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      <DialogDescription className="text-sm">
        View your enhanced storybook. Use the controls below to navigate between pages and switch between original and enhanced versions.
      </DialogDescription>
    </DialogHeader>
  );
}
