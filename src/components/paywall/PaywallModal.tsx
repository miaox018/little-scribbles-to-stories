
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Crown, Sparkles, Tag, X, Loader2 } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { useCouponValidation } from "@/hooks/useCouponValidation";
import { toast } from "@/hooks/use-toast";

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveStory?: () => void;
  storyTitle?: string;
}

export function PaywallModal({ isOpen, onClose, onSaveStory, storyTitle }: PaywallModalProps) {
  const { createCheckoutSession } = useSubscription();
  const { validateCoupon, removeCoupon, isValidating, appliedCoupon, couponDiscount } = useCouponValidation();
  const [couponCode, setCouponCode] = useState("");
  const [isCreatingCheckout, setIsCreatingCheckout] = useState(false);

  const handleUpgrade = async (tier: 'storypro' | 'storypro_plus') => {
    console.log('Starting checkout process for tier:', tier);
    setIsCreatingCheckout(true);
    
    try {
      await createCheckoutSession(tier, appliedCoupon);
      onClose();
    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        title: "Error",
        description: "Failed to create checkout session. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsCreatingCheckout(false);
    }
  };

  const handleCouponValidation = async (tier: 'storypro' | 'storypro_plus') => {
    if (!couponCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter a coupon code",
        variant: "destructive"
      });
      return;
    }
    
    await validateCoupon(couponCode, tier);
  };

  const calculateDiscountedPrice = (originalPrice: number) => {
    if (!couponDiscount?.valid) return originalPrice;
    
    if (couponDiscount.discount_percent > 0) {
      return originalPrice * (1 - couponDiscount.discount_percent / 100);
    } else if (couponDiscount.discount_amount > 0) {
      return Math.max(0, originalPrice - couponDiscount.discount_amount / 100);
    }
    return originalPrice;
  };

  const plans = [
    {
      name: "Free",
      price: 0,
      originalPrice: 0,
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
      price: calculateDiscountedPrice(4.99),
      originalPrice: 4.99,
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
      price: calculateDiscountedPrice(9.99),
      originalPrice: 9.99,
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

        {/* Coupon Code Section */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <Tag className="h-4 w-4 text-purple-600" />
            <span className="font-medium text-gray-700">Have a coupon code?</span>
          </div>
          
          {appliedCoupon ? (
            <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                <span className="text-green-700 font-medium">Coupon "{appliedCoupon}" applied!</span>
                <span className="text-sm text-green-600">
                  {couponDiscount?.discount_percent 
                    ? `${couponDiscount.discount_percent}% off`
                    : `$${(couponDiscount?.discount_amount || 0) / 100} off`
                  }
                </span>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={removeCoupon}
                className="text-green-700 hover:text-green-800"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter coupon code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  className="flex-1"
                />
              </div>
              <p className="text-sm text-gray-500">
                Enter a coupon code and select a plan below to apply the discount
              </p>
            </div>
          )}
        </div>

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
                  {plan.price !== plan.originalPrice && plan.originalPrice > 0 ? (
                    <div className="flex items-center justify-center gap-2">
                      <span className="line-through text-gray-400 text-xl">
                        ${plan.originalPrice.toFixed(2)}
                      </span>
                      <span className="text-green-600">
                        ${plan.price.toFixed(2)}
                      </span>
                    </div>
                  ) : (
                    <span>
                      {plan.price > 0 ? `$${plan.price.toFixed(2)}` : '$0'}
                    </span>
                  )}
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

                {plan.tier && (
                  <div className="space-y-2">
                    {/* Apply Coupon Button - only show if coupon code entered and no coupon applied */}
                    {couponCode.trim() && !appliedCoupon && (
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => handleCouponValidation(plan.tier!)}
                        disabled={isValidating}
                      >
                        {isValidating ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Tag className="h-4 w-4 mr-2" />
                        )}
                        Apply Coupon
                      </Button>
                    )}

                    {/* Upgrade Button */}
                    <Button
                      className={`w-full ${
                        plan.popular 
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700' 
                          : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
                      }`}
                      onClick={() => handleUpgrade(plan.tier!)}
                      disabled={isCreatingCheckout}
                    >
                      {isCreatingCheckout ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : null}
                      {plan.buttonText}
                    </Button>
                  </div>
                )}

                {!plan.tier && (
                  <Button
                    className="w-full bg-gray-400 cursor-not-allowed"
                    disabled={true}
                  >
                    {plan.buttonText}
                  </Button>
                )}
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
