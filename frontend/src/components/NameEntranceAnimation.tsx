import React, { useEffect, useRef, useState } from 'react';

interface NameEntranceAnimationProps {
  children: React.ReactNode;
  onComplete?: () => void;
}

export default function NameEntranceAnimation({ children, onComplete }: NameEntranceAnimationProps) {
  const [animationComplete, setAnimationComplete] = useState(false);
  const hasPlayedRef = useRef(false);

  useEffect(() => {
    // Check if animation has already played in this session
    const hasPlayed = sessionStorage.getItem('nameAnimationPlayed');
    if (hasPlayed) {
      setAnimationComplete(true);
      hasPlayedRef.current = true;
      return;
    }

    // Start animation after a brief delay
    const startTimeout = setTimeout(() => {
      // Keep the first impression calm and fast.
      const animationTimeout = setTimeout(() => {
        setAnimationComplete(true);
        sessionStorage.setItem('nameAnimationPlayed', 'true');
        hasPlayedRef.current = true;
        if (onComplete) onComplete();
      }, 900);

      return () => clearTimeout(animationTimeout);
    }, 100);

    return () => clearTimeout(startTimeout);
  }, [onComplete]);

  // Check for reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReducedMotion || hasPlayedRef.current) {
    return <>{children}</>;
  }

  return (
    <div className="relative inline-block">
      <div
        className={`relative transition-all duration-1000 ${
          animationComplete ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ 
          animation: animationComplete ? 'none' : 'page-fade-in 900ms ease-out forwards',
          transitionDelay: animationComplete ? '0ms' : '0ms'
        }}
      >
        {children}
      </div>
    </div>
  );
}
