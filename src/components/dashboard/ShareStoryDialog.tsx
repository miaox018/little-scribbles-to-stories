
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LinkShareSection } from "./share-story/LinkShareSection";
import { SocialShareSection } from "./share-story/SocialShareSection";

interface ShareStoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  story: any;
}

export function ShareStoryDialog({ isOpen, onClose, story }: ShareStoryDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Story</DialogTitle>
          <DialogDescription>
            Share "{story?.title}" with family and friends by copying the link or sharing on social media
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Copy Link Section - Primary */}
          <LinkShareSection story={story} />

          {/* Social Media Sharing */}
          <SocialShareSection story={story} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
