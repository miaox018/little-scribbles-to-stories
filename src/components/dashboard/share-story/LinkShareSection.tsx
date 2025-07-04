
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
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
  );
}
