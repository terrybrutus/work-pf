import React from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, RefreshCw } from 'lucide-react';
import ConstellationBackground from '../ConstellationBackground';

interface ErrorBoundaryProps {
  error?: Error | null;
  onRetry?: () => void;
}

export default function ErrorBoundary({ error, onRetry }: ErrorBoundaryProps) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center relative">
      <ConstellationBackground />
      <div className="text-center max-w-md mx-auto p-6 relative z-10">
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            We're having trouble loading the portfolio. This could be due to network issues or backend connectivity problems.
          </AlertDescription>
        </Alert>
        <div className="space-y-4">
          <div className="text-destructive text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
          <p className="text-muted-foreground mb-4">
            {error && 'Failed to load content. '}
            Please try refreshing the page or check your internet connection.
          </p>
          <div className="flex gap-2 justify-center">
            <Button onClick={() => window.location.reload()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Page
            </Button>
            {onRetry && (
              <Button variant="outline" onClick={onRetry}>
                Retry
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
