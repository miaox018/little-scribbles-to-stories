
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface SocialShareSectionProps {
  story: any;
}

export function SocialShareSection({ story }: SocialShareSectionProps) {
  const shareUrl = `${window.location.origin}/shared-story/${story?.id}`;

  const handleSocialShare = (platform: 'facebook' | 'x' | 'instagram') => {
    const text = `Check out this amazing story: "${story?.title}"`;
    const url = shareUrl;
    
    let shareLink = '';
    if (platform === 'facebook') {
      shareLink = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    } else if (platform === 'x') {
      shareLink = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    } else if (platform === 'instagram') {
      // Instagram doesn't have a direct share URL, so we'll copy to clipboard
      navigator.clipboard.writeText(`${text} ${url}`);
      alert('Story link copied to clipboard! You can now paste it in your Instagram post or story.');
      return;
    }
    
    if (shareLink) {
      window.open(shareLink, '_blank', 'width=600,height=400');
    }
  };

  return (
    <div className="space-y-2">
      <Label>Share on Social Media</Label>
      <div className="grid grid-cols-3 gap-2">
        <Button
          onClick={() => handleSocialShare('facebook')}
          variant="outline"
          className="text-xs"
        >
          Facebook
        </Button>
        <Button
          onClick={() => handleSocialShare('x')}
          variant="outline"
          className="text-xs"
        >
          X (Twitter)
        </Button>
        <Button
          onClick={() => handleSocialShare('instagram')}
          variant="outline"
          className="text-xs"
        >
          Instagram
        </Button>
      </div>
    </div>
  );
}
