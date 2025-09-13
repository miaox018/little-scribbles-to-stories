import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Gem, ArrowUp, ArrowDown, Image, RefreshCw } from 'lucide-react';
import { useCredits } from '@/hooks/useCredits';
import { format } from 'date-fns';

interface CreditHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreditHistoryModal({ isOpen, onClose }: CreditHistoryModalProps) {
  const { transactions, isTransactionsLoading, creditInfo } = useCredits();

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'purchase':
        return <ArrowUp className="h-4 w-4 text-green-600" />;
      case 'page_generation':
        return <Image className="h-4 w-4 text-blue-600" />;
      case 'page_regeneration':
        return <RefreshCw className="h-4 w-4 text-orange-600" />;
      default:
        return <ArrowDown className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'purchase':
        return 'text-green-600';
      case 'page_generation':
        return 'text-blue-600';
      case 'page_regeneration':
        return 'text-orange-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatTransactionType = (type: string) => {
    switch (type) {
      case 'purchase':
        return 'Credits Purchased';
      case 'page_generation':
        return 'Page Generated';
      case 'page_regeneration':
        return 'Page Regenerated';
      default:
        return type;
    }
  };

  if (isTransactionsLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Credit History</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <div className="h-6 w-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gem className="h-5 w-5 text-purple-600" />
            Credit History
          </DialogTitle>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>Total Credits: {creditInfo.total_credits}</span>
            <span>Used: {creditInfo.used_credits}</span>
            <span>Remaining: {creditInfo.remaining_credits}</span>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[400px]">
          <div className="space-y-3">
            {transactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Gem className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>No credit transactions yet</p>
                <p className="text-sm">Start creating stories to see your credit usage here!</p>
              </div>
            ) : (
              transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {getTransactionIcon(transaction.transaction_type)}
                    <div>
                      <p className="font-medium text-sm">
                        {formatTransactionType(transaction.transaction_type)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(transaction.created_at), 'MMM d, yyyy • h:mm a')}
                      </p>
                      {transaction.description && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {transaction.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <Badge
                      variant={transaction.credits_amount > 0 ? "default" : "secondary"}
                      className={`${
                        transaction.credits_amount > 0
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {transaction.credits_amount > 0 ? '+' : ''}
                      {transaction.credits_amount}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        <div className="pt-4 border-t">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">
              Showing {transactions.length} recent transactions
            </span>
            <div className="flex items-center gap-2">
              <Gem className="h-4 w-4 text-purple-600" />
              <span className="font-semibold">
                {creditInfo.remaining_credits} credits remaining
              </span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
