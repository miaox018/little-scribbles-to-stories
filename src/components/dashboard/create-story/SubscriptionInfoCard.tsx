
import { Card, CardContent } from "@/components/ui/card";

interface SubscriptionInfoCardProps {
  subscriptionTier: string;
  maxPages: number;
  onUpgradeClick?: () => void;
}

export function SubscriptionInfoCard({ subscriptionTier, maxPages, onUpgradeClick }: SubscriptionInfoCardProps) {
  const tierDisplayName = subscriptionTier === 'free' ? 'Free Plan' : 
                         subscriptionTier === 'storypro' ? 'StoryPro Plan' : 
                         subscriptionTier === 'storypro_plus' ? 'StoryPro+ Plan' : 
                         `${subscriptionTier} Plan`;

  return (
    <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
      <CardContent className="p-4">
        <p className="text-sm text-purple-700">
          <strong>{tierDisplayName}:</strong> 
          {' '}Transform up to {maxPages} pages per story
          {subscriptionTier === 'free' && (
            <span className="ml-2">
              <button 
                onClick={onUpgradeClick}
                className="text-purple-600 hover:text-purple-800 underline hover:no-underline transition-colors cursor-pointer"
              >
                Upgrade for up to 15 pages per story and advanced features!
              </button>
            </span>
          )}
        </p>
      </CardContent>
    </Card>
  );
}
