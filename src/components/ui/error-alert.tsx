import { AlertTriangle, X, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './alert';
import { Button } from './button';

interface ErrorAlertProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  variant?: 'destructive' | 'default';
}

export function ErrorAlert({
  title = 'Fel',
  message,
  onRetry,
  onDismiss,
  variant = 'destructive'
}: ErrorAlertProps) {
  return (
    <Alert variant={variant} className="relative">
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors"
          aria-label="Stäng"
        >
          <X className="h-4 w-4" />
        </button>
      )}

      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="mt-2 flex flex-col gap-3">
        <p>{message}</p>
        {onRetry && (
          <Button
            onClick={onRetry}
            variant="outline"
            size="sm"
            className="w-fit"
          >
            <RefreshCw className="h-3 w-3 mr-2" />
            Försök igen
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}
