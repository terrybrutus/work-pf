import React, { useEffect, useRef, useState } from 'react';
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver';

interface AnimatedSectionProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  animation?: 'fade' | 'slide-up' | 'slide-left' | 'slide-right' | 'scale';
}

export default function AnimatedSection({ 
  children, 
  className = '', 
  delay = 0,
  animation = 'fade'
}: AnimatedSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isIntersecting = useIntersectionObserver(ref);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    if (ref.current) {
      if (isIntersecting && !hasAnimated) {
        setTimeout(() => {
          if (ref.current) {
            ref.current.style.opacity = '1';
            ref.current.style.transform = 'translateY(0) translateX(0) scale(1)';
            setHasAnimated(true);
          }
        }, delay);
      } else if (!isIntersecting && !hasAnimated) {
        // Set initial state based on animation type
        switch (animation) {
          case 'slide-up':
            ref.current.style.transform = 'translateY(32px)';
            break;
          case 'slide-left':
            ref.current.style.transform = 'translateX(32px)';
            break;
          case 'slide-right':
            ref.current.style.transform = 'translateX(-32px)';
            break;
          case 'scale':
            ref.current.style.transform = 'scale(0.95)';
            break;
          default:
            ref.current.style.transform = 'translateY(0)';
        }
        ref.current.style.opacity = '0';
      }
    }
  }, [isIntersecting, delay, animation, hasAnimated]);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out opacity-0 ${className}`}
      style={{ 
        transitionDelay: `${delay}ms`,
        willChange: 'opacity, transform'
      }}
    >
      {children}
    </div>
  );
}
