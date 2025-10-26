'use client';

import { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-gray-800 rounded-lg p-8 text-center">
            <div className="mb-6 flex justify-center">
              <div className="p-4 bg-red-500/10 rounded-full">
                <AlertTriangle className="h-12 w-12 text-red-500" />
              </div>
            </div>

            <h2 className="text-2xl font-bold text-white mb-3">
              Något gick fel
            </h2>

            <p className="text-gray-400 mb-6">
              Ett oväntat fel har inträffat. Vi ber om ursäkt för besväret.
            </p>

            {this.state.error && (
              <div className="mb-6 p-4 bg-gray-900 rounded-lg text-left">
                <p className="text-sm font-mono text-red-400">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <Button
              onClick={() => window.location.reload()}
              className="w-full bg-orange-500 hover:bg-orange-600"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Ladda om sidan
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
