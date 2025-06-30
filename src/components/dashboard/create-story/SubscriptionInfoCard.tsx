
import { Card, CardContent } from "@/components/ui/card";

interface SubscriptionInfoCardProps {
  subscriptionTier: string;
  maxPages: number;
}

export function SubscriptionInfoCard({ subscriptionTier, maxPages }: SubscriptionInfoCardProps) {
  return (
    <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
      <CardContent className="p-4">
        <p className="text-sm text-purple-700">
          <strong>{subscriptionTier === 'free' ? 'Free Plan' : `${subscriptionTier} Plan`}:</strong> 
          {' '}Transform up to {maxPages} pages per story
          {subscriptionTier === 'free' && (
            <span className="ml-2">
              Upgrade for up to 15 pages per story and advanced features!
            </span>
          )}
        </p>
      </CardContent>
    </Card>
  );
}
