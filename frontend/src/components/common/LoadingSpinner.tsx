import React from 'react';
import { Loader2 } from 'lucide-react';

export default function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-32 w-32 animate-spin text-primary mx-auto mb-4" />
        <p className="text-lg text-muted-foreground">Loading portfolio...</p>
      </div>
    </div>
  );
}
