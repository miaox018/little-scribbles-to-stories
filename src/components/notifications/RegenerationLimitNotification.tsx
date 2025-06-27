
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Crown } from "lucide-react";

interface RegenerationLimitNotificationProps {
  onUpgrade: () => void;
}

export const showRegenerationLimitNotification = (onUpgrade: () => void) => {
  toast({
    title: "Regeneration Limit Reached",
    description: (
      <div className="space-y-3">
        <p>You've reached your page regeneration limit for this story.</p>
        <Button 
          onClick={onUpgrade}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
        >
          <Crown className="h-4 w-4 mr-2" />
          Upgrade for More Regenerations
        </Button>
      </div>
    ),
    duration: 10000, // Show for 10 seconds
    variant: "destructive"
  });
};
