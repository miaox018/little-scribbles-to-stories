import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Gem, Plus, History } from 'lucide-react';
import { useCredits } from '@/hooks/useCredits';
import { CreditPurchaseModal } from './CreditPurchaseModal';
import { CreditHistoryModal } from './CreditHistoryModal';

interface CreditCounterProps {
  showPurchaseButton?: boolean;
  showHistoryButton?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'compact';
}

export function CreditCounter({ 
  showPurchaseButton = true,
  showHistoryButton = false,
  size = 'md',
  variant = 'default'
}: CreditCounterProps) {
  const { creditInfo, isLoading, formatCreditsDisplay } = useCredits();
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <div className="h-6 w-16 bg-gray-200 rounded animate-pulse" />
      </div>
    );
  }

  const getColorClass = () => {
    if (creditInfo.remaining_credits === 0) return 'bg-red-100 text-red-800 border-red-200';
    if (creditInfo.remaining_credits <= 2) return 'bg-amber-100 text-amber-800 border-amber-200';
    return 'bg-green-100 text-green-800 border-green-200';
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm': return 'text-xs px-2 py-1';
      case 'lg': return 'text-base px-4 py-2';
      default: return 'text-sm px-3 py-1.5';
    }
  };

  if (variant === 'compact') {
    return (
      <>
        <div className="flex items-center gap-2">
          <Badge className={`${getColorClass()} ${getSizeClasses()}`}>
            <Gem className="h-3 w-3 mr-1" />
            {creditInfo.remaining_credits}
          </Badge>
          {showPurchaseButton && creditInfo.remaining_credits <= 2 && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowPurchaseModal(true)}
              className="h-7 px-2"
            >
              <Plus className="h-3 w-3" />
            </Button>
          )}
        </div>

        <CreditPurchaseModal
          isOpen={showPurchaseModal}
          onClose={() => setShowPurchaseModal(false)}
        />
      </>
    );
  }

  return (
    <>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Gem className="h-5 w-5 text-purple-600" />
          <div className="flex flex-col">
            <span className="font-semibold text-sm">
              {formatCreditsDisplay(creditInfo.remaining_credits)}
            </span>
            <span className="text-xs text-muted-foreground">
              of {creditInfo.total_credits} total
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          {showHistoryButton && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowHistoryModal(true)}
              className="h-8 px-2"
            >
              <History className="h-4 w-4" />
            </Button>
          )}
          
          {showPurchaseButton && (
            <Button
              size="sm"
              onClick={() => setShowPurchaseModal(true)}
              className="h-8"
            >
              <Plus className="h-4 w-4 mr-1" />
              Buy Credits
            </Button>
          )}
        </div>
      </div>

      <CreditPurchaseModal
        isOpen={showPurchaseModal}
        onClose={() => setShowPurchaseModal(false)}
      />

      {showHistoryModal && (
        <CreditHistoryModal
          isOpen={showHistoryModal}
          onClose={() => setShowHistoryModal(false)}
        />
      )}
    </>
  );
}
