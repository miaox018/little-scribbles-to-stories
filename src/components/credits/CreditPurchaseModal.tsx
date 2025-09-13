import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Zap, Crown, CreditCard } from 'lucide-react';
import { useCredits } from '@/hooks/useCredits';
import { useCouponValidation } from '@/hooks/useCouponValidation';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface CreditPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  creditsNeeded?: number;
  context?: string;
}

export function CreditPurchaseModal({ 
  isOpen, 
  onClose, 
  creditsNeeded = 0,
  context = "Continue creating amazing stories"
}: CreditPurchaseModalProps) {
  const { creditInfo, formatCreditsDisplay } = useCredits();
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const { validateCoupon, isValidating } = useCouponValidation();

  const creditPackages = [
    {
      id: 'starter',
      name: "Starter Pack",
      credits: 4,
      price: 2.99,
      originalPrice: 2.99,
      pricePerCredit: 0.75,
      icon: Sparkles,
      popular: false,
      description: "Perfect for trying out more stories",
      features: [
        "4 additional credits",
        "Generate or regenerate 4 pages",
        "All art styles included",
        "High-quality AI illustrations"
      ]
    },
    {
      id: 'creator',
      name: "Creator Pack",
      credits: 10,
      price: 6.99,
      originalPrice: 6.99,
      pricePerCredit: 0.70,
      icon: Zap,
      popular: true,
      description: "Great for regular story creators",
      features: [
        "10 credits (best value!)",
        "Create 2-3 complete stories",
        "Mix and match page counts",
        "All premium features"
      ]
    },
    {
      id: 'storyteller',
      name: "Storyteller Pack",
      credits: 20,
      price: 12.99,
      originalPrice: 12.99,
      pricePerCredit: 0.65,
      icon: Crown,
      popular: false,
      description: "For serious storytellers",
      features: [
        "20 credits (maximum value)",
        "Create 5+ complete stories",
        "Perfect for families",
        "Bulk discount included"
      ]
    }
  ];

  const calculateDiscountedPrice = (originalPrice: number) => {
    // Apply coupon discount logic here if needed
    return originalPrice;
  };

  const handlePurchase = async (packageId: string) => {
    setSelectedPackage(packageId);
    setIsProcessing(true);

    try {
      const selectedPack = creditPackages.find(p => p.id === packageId);
      if (!selectedPack) throw new Error('Package not found');

      // Here you would integrate with your payment system
      // For now, we'll simulate the purchase
      console.log('Purchasing credits:', {
        package: selectedPack,
        couponCode: couponCode || undefined
      });

      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      toast({
        title: "Credits Purchased! 🎉",
        description: `${selectedPack.credits} credits have been added to your account.`,
      });

      onClose();
    } catch (error: any) {
      console.error('Purchase error:', error);
      toast({
        title: "Purchase Failed",
        description: error.message || "Failed to process payment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
      setSelectedPackage(null);
    }
  };

  const getRecommendedPackage = () => {
    if (creditsNeeded <= 4) return 'starter';
    if (creditsNeeded <= 10) return 'creator';
    return 'storyteller';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            Purchase Credits 💎
          </DialogTitle>
          <div className="text-center space-y-2">
            <p className="text-muted-foreground">
              {context}
            </p>
            {creditsNeeded > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-amber-800 font-medium">
                  You need {formatCreditsDisplay(creditsNeeded)} to continue
                </p>
                <p className="text-sm text-amber-700">
                  Current balance: {formatCreditsDisplay(creditInfo.remaining_credits)}
                </p>
              </div>
            )}
          </div>
        </DialogHeader>

        <div className="grid md:grid-cols-3 gap-4 mt-6">
          {creditPackages.map((pack) => {
            const Icon = pack.icon;
            const isRecommended = pack.id === getRecommendedPackage() && creditsNeeded > 0;
            
            return (
              <div
                key={pack.id}
                className={`relative border rounded-lg p-6 transition-all hover:shadow-lg ${
                  pack.popular || isRecommended 
                    ? 'border-purple-300 bg-purple-50' 
                    : 'border-gray-200'
                }`}
              >
                {(pack.popular || isRecommended) && (
                  <Badge 
                    className={`absolute -top-2 left-1/2 transform -translate-x-1/2 ${
                      isRecommended ? 'bg-amber-500' : 'bg-purple-600'
                    }`}
                  >
                    {isRecommended ? 'Recommended' : 'Most Popular'}
                  </Badge>
                )}
                
                <div className="text-center space-y-4">
                  <Icon className={`mx-auto h-8 w-8 ${
                    pack.popular || isRecommended ? 'text-purple-600' : 'text-gray-600'
                  }`} />
                  
                  <div>
                    <h3 className="text-lg font-semibold">{pack.name}</h3>
                    <p className="text-sm text-muted-foreground">{pack.description}</p>
                  </div>

                  <div className="space-y-1">
                    <div className="text-3xl font-bold">${pack.price}</div>
                    <div className="text-sm text-muted-foreground">
                      {formatCreditsDisplay(pack.credits)} • ${pack.pricePerCredit.toFixed(2)} per credit
                    </div>
                  </div>

                  <ul className="space-y-2 text-sm">
                    {pack.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 bg-green-500 rounded-full" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <Button
                    onClick={() => handlePurchase(pack.id)}
                    disabled={isProcessing}
                    className={`w-full ${
                      pack.popular || isRecommended
                        ? 'bg-purple-600 hover:bg-purple-700'
                        : ''
                    }`}
                  >
                    {isProcessing && selectedPackage === pack.id ? (
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Processing...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Purchase Credits
                      </div>
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Coupon Code Section */}
        <div className="mt-6 pt-6 border-t">
          <div className="max-w-md mx-auto space-y-3">
            <label className="text-sm font-medium">Have a coupon code?</label>
            <div className="flex gap-2">
              <Input
                placeholder="Enter coupon code"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                className="flex-1"
              />
              <Button
                variant="outline"
                onClick={() => validateCoupon(couponCode)}
                disabled={!couponCode || isValidating}
              >
                {isValidating ? 'Validating...' : 'Apply'}
              </Button>
            </div>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="mt-6 pt-6 border-t text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            ✨ Credits never expire • 🔒 Secure payment • 💝 30-day money-back guarantee
          </p>
          <p className="text-xs text-muted-foreground">
            All purchases are processed securely through Stripe
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
