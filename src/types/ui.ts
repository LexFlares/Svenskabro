export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface ToastOptions {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
  duration?: number;
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export type Theme = 'light' | 'dark' | 'system';

export type Language = 'sv' | 'en';
