import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Clock, AlertTriangle } from 'lucide-react';
import { ExpirationInfo } from '@/utils/storyExpiration';

interface StoryExpirationWarningProps {
  expirationInfo: ExpirationInfo;
  onSaveToLibrary?: () => void;
  className?: string;
}

export const StoryExpirationWarning = ({ 
  expirationInfo, 
  onSaveToLibrary,
  className = ""
}: StoryExpirationWarningProps) => {
  if (!expirationInfo.isExpiring && !expirationInfo.isExpired) {
    return null;
  }

  return (
    <Alert 
      variant={expirationInfo.isExpired ? "destructive" : "default"}
      className={`${className} ${expirationInfo.isExpired ? 'border-destructive' : 'border-warning bg-warning/10'}`}
    >
      {expirationInfo.isExpired ? (
        <AlertTriangle className="h-4 w-4" />
      ) : (
        <Clock className="h-4 w-4" />
      )}
      <AlertDescription className="flex items-center justify-between">
        <span className="text-sm">
          {expirationInfo.warningMessage}
        </span>
        {!expirationInfo.isExpired && onSaveToLibrary && (
          <Button 
            size="sm" 
            onClick={onSaveToLibrary}
            className="ml-4"
          >
            Save to Library
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
};