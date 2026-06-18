import React, { Suspense } from 'react';
import { Toaster } from '@/components/ui/sonner';
import LoadingSpinner from './components/common/LoadingSpinner';
import Portfolio from './pages/Portfolio';

export default function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <div id="app">
        <Portfolio />
        <Toaster />
      </div>
    </Suspense>
  );
}
