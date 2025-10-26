import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  text?: string;
}

export function LoadingSpinner({ size = 'md', className, text }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  };

  return (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
      <Loader2 className={cn('animate-spin text-orange-500', sizeClasses[size])} />
      {text && <p className="text-sm text-gray-400">{text}</p>}
    </div>
  );
}

export function FullPageLoading({ text = 'Laddar...' }: { text?: string }) {
  return (
    <div className="fixed inset-0 bg-gray-900/95 flex items-center justify-center z-50">
      <LoadingSpinner size="xl" text={text} />
    </div>
  );
}
