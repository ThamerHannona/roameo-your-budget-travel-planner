import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div 
          className="min-h-screen bg-background flex items-center justify-center p-4"
          role="alert"
          aria-live="assertive"
        >
          <div className="max-w-md w-full text-center space-y-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-destructive/10 mx-auto">
              <AlertTriangle className="h-10 w-10 text-destructive" aria-hidden="true" />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-display font-bold text-foreground">
                Something went wrong
              </h1>
              <p className="text-muted-foreground">
                We encountered an unexpected error. Please try again or return to the home page.
              </p>
              {this.state.error && (
                <p className="text-sm text-destructive mt-4 p-3 bg-destructive/5 rounded-lg font-mono">
                  {this.state.error.message}
                </p>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                onClick={this.handleRetry}
                className="gap-2"
                aria-label="Try again"
              >
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                Try Again
              </Button>
              <Button 
                variant="outline" 
                onClick={this.handleGoHome}
                className="gap-2"
                aria-label="Go to home page"
              >
                <Home className="h-4 w-4" aria-hidden="true" />
                Go Home
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
