
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface CarouselDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: React.ReactNode;
}

export function CarouselDialog({ isOpen, onOpenChange, title, children }: CarouselDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[95vh] p-0 overflow-hidden">
        <DialogTitle className="sr-only">{title}</DialogTitle>
        <DialogDescription className="sr-only">Story viewer displaying pages of {title}</DialogDescription>
        <div className="relative bg-white rounded-lg overflow-hidden">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
}
