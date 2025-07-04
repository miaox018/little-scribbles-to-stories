
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Copy, Check, Link } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface LinkShareSectionProps {
  story: any;
}

export function LinkShareSection({ story }: LinkShareSectionProps) {
  const [copied, setCopied] = useState(false);
  
  const shareUrl = `${window.location.origin}/shared-story/${story?.id}`;

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

  return (
    <div className="space-y-2">
      <Label htmlFor="share-url" className="flex items-center gap-2">
        <Link className="h-4 w-4 text-purple-600" />
        Share Link
      </Label>
      <p className="text-sm text-gray-600 mb-3">
        Copy this link and share it anywhere! Recipients can view the story online on any device.
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
      <div className="text-xs text-gray-500 mt-2 flex items-center gap-1">
        🌐 Works on any device - perfect for sharing via email, messaging, or anywhere else!
      </div>
    </div>
  );
}
