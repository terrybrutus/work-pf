import { useCallback } from 'react';

export function useScrollToSection() {
  const scrollToSection = useCallback((sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const navBarHeight = 128;
      const elementPosition = element.offsetTop - navBarHeight;
      
      window.scrollTo({
        top: elementPosition,
        behavior: 'smooth'
      });
    }
  }, []);

  return scrollToSection;
}
