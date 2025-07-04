
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface SocialShareSectionProps {
  story: any;
}

export function SocialShareSection({ story }: SocialShareSectionProps) {
  const shareUrl = `${window.location.origin}/story/${story?.id}`;

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
  );
}
