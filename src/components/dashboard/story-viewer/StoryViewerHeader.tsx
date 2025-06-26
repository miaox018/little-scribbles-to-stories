
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
      <DialogTitle className="flex items-center justify-between">
        <span className="truncate pr-4 text-lg">{title}</span>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </DialogTitle>
      <DialogDescription className="text-sm">
        View your enhanced storybook. Use the controls below to navigate between pages and switch between original and enhanced versions.
      </DialogDescription>
    </DialogHeader>
  );
}
