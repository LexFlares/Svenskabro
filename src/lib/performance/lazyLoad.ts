import dynamic from 'next/dynamic';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export const lazyLoadComponent = <T extends React.ComponentType<unknown>>(
  importFunc: () => Promise<{ default: T }>,
  loadingText?: string
) => {
  return dynamic(importFunc, {
    loading: () => <LoadingSpinner size="lg" text={loadingText} />,
    ssr: false,
  });
};

export const lazyComponents = {
  TrafficMap: () => import('@/components/TrafficMap'),
  CallInterface: () => import('@/components/CallInterface'),
  EnhancedMap: () => import('@/components/EnhancedMap'),
};
