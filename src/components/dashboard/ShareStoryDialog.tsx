
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Check, Mail, FileText } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ShareStoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  story: any;
}

export function ShareStoryDialog({ isOpen, onClose, story }: ShareStoryDialogProps) {
  const [copied, setCopied] = useState(false);
  const [email, setEmail] = useState("");
  const [isSending, setIsSending] = useState(false);

  // Generate shareable URL (you can customize this based on your app structure)
  const shareUrl = `${window.location.origin}/story/${story?.id}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast({
        title: "Link Copied",
        description: "Story link has been copied to your clipboard!",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy link. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleShareByEmail = async () => {
    if (!email) {
      toast({
        title: "Email Required",
        description: "Please enter an email address to share the story.",
        variant: "destructive",
      });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-story-email', {
        body: {
          recipientEmail: email,
          storyTitle: story?.title,
          storyId: story?.id,
        }
      });

      if (error) {
        throw error;
      }
      
      toast({
        title: "Story PDF Sent! 📚",
        description: `A PDF of "${story?.title}" has been sent to ${email}`,
      });
      setEmail("");
      onClose();
    } catch (error: any) {
      console.error('Email sharing error:', error);
      toast({
        title: "Share Failed",
        description: error.message || "Failed to send story PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleSocialShare = (platform: 'facebook' | 'twitter') => {
    const text = `Check out this amazing story: "${story?.title}"`;
    const url = shareUrl;
    
    let shareLink = '';
    if (platform === 'facebook') {
      shareLink = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    } else if (platform === 'twitter') {
      shareLink = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    }
    
    window.open(shareLink, '_blank', 'width=600,height=400');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Story</DialogTitle>
          <DialogDescription>
            Share "{story?.title}" with family and friends
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Email PDF Sharing Section - Now Primary */}
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-purple-600" />
              Send Story as PDF
            </Label>
            <p className="text-sm text-gray-600 mb-3">
              Recipients will receive a beautiful PDF version of your story that they can read, print, or share.
            </p>
            <div className="flex space-x-2">
              <Input
                id="email"
                type="email"
                placeholder="Enter email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleShareByEmail();
                  }
                }}
              />
              <Button
                onClick={handleShareByEmail}
                disabled={isSending}
                size="sm"
                className="px-4 bg-purple-600 hover:bg-purple-700"
              >
                {isSending ? (
                  <Mail className="h-4 w-4 animate-pulse" />
                ) : (
                  <FileText className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Copy Link Section - Now Secondary */}
          <div className="space-y-2">
            <Label htmlFor="share-url">Or Share Link</Label>
            <p className="text-sm text-gray-600 mb-2">
              Note: Recipients will need access to view the story online.
            </p>
            <div className="flex space-x-2">
              <Input
                id="share-url"
                value={shareUrl}
                readOnly
                className="flex-1 text-sm"
              />
              <Button
                onClick={handleCopyLink}
                size="sm"
                variant="outline"
                className="px-3"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Social Media Sharing */}
          <div className="space-y-2">
            <Label>Share on Social Media</Label>
            <div className="flex space-x-2">
              <Button
                onClick={() => handleSocialShare('facebook')}
                variant="outline"
                className="flex-1"
              >
                Facebook
              </Button>
              <Button
                onClick={() => handleSocialShare('twitter')}
                variant="outline"
                className="flex-1"
              >
                Twitter
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
