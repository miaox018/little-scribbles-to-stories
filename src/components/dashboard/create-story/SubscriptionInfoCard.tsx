
import { Card, CardContent } from "@/components/ui/card";
import { useUserRoles } from "@/hooks/useUserRoles";

interface SubscriptionInfoCardProps {
  subscriptionTier: string;
  maxPages: number;
  onUpgradeClick?: () => void;
}

export function SubscriptionInfoCard({ subscriptionTier, maxPages, onUpgradeClick }: SubscriptionInfoCardProps) {
  const { isAdmin } = useUserRoles();
  // Show admin status if user is admin
  if (isAdmin) {
    return (
      <Card className="bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-200">
        <CardContent className="p-4">
          <p className="text-sm text-emerald-700">
            <strong>Admin Access - Unlimited:</strong> 
            {' '}Create unlimited stories with unlimited pages
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
      <CardContent className="p-4">
        <p className="text-sm text-purple-700">
          <strong>{subscriptionTier === 'free' ? 'Free Plan' : `${subscriptionTier} Plan`}:</strong> 
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
