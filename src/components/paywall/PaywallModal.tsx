
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Crown, Sparkles } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { toast } from "@/hooks/use-toast";

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveStory?: () => void;
  storyTitle?: string;
}

export function PaywallModal({ isOpen, onClose, onSaveStory, storyTitle }: PaywallModalProps) {
  const { createCheckoutSession } = useSubscription();

  const handleUpgrade = async (tier: 'storypro' | 'storypro_plus') => {
    try {
      await createCheckoutSession(tier);
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create checkout session. Please try again.",
        variant: "destructive"
      });
    }
  };

  const plans = [
    {
      name: "Free",
      price: "$0",
      period: "forever",
      tier: null,
      current: true,
      features: [
        "1 complete story",
        "Up to 8 illustrated pages",
        "1 page regeneration",
        "Perfect for trying the product"
      ],
      buttonText: "Current Plan",
      buttonDisabled: true,
    },
    {
      name: "StoryPro",
      price: "$4.99",
      period: "month",
      tier: "storypro" as const,
      current: false,
      popular: false,
      features: [
        "5 stories per month",
        "Up to 12 pages per story",
        "3 regenerations per story",
        "Great for casual creators"
      ],
      buttonText: "Upgrade to StoryPro",
      buttonDisabled: false,
    },
    {
      name: "StoryPro+",
      price: "$9.99",
      period: "month",
      tier: "storypro_plus" as const,
      current: false,
      popular: true,
      features: [
        "10 stories per month",
        "Up to 15 pages per story", 
        "5 regenerations per story",
        "Best for families & frequent creators"
      ],
      buttonText: "Upgrade to StoryPro+",
      buttonDisabled: false,
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            Save "{storyTitle}" to Your Library
          </DialogTitle>
          <p className="text-center text-gray-600 mt-2">
            Choose a plan to save your story and unlock more creative possibilities
          </p>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          {plans.map((plan) => (
            <Card 
              key={plan.name} 
              className={`relative ${plan.popular ? 'border-purple-500 border-2' : ''} ${plan.current ? 'bg-gray-50' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                    <Crown className="h-3 w-3" />
                    Most Popular
                  </span>
                </div>
              )}
              
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-xl font-bold flex items-center justify-center gap-2">
                  {plan.name}
                  {plan.name !== "Free" && <Sparkles className="h-4 w-4 text-purple-600" />}
                </CardTitle>
                <div className="text-3xl font-bold text-gray-800">
                  {plan.price}
                  <span className="text-base font-normal text-gray-600">/{plan.period}</span>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className={`w-full ${
                    plan.popular 
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700' 
                      : plan.current
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
                  }`}
                  disabled={plan.buttonDisabled}
                  onClick={() => plan.tier && handleUpgrade(plan.tier)}
                >
                  {plan.buttonText}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Your story will remain in "In Progress" until you choose a plan. 
            You can continue editing and previewing for free!
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
