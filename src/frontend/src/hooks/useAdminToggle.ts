import { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';

const ADMIN_BUTTONS_STORAGE_KEY = 'admin-buttons-visible';

export function useAdminToggle(isAuthenticated: boolean, isAdmin: boolean) {
  // Initialize state based on authentication and admin status
  const [showAdminButtons, setShowAdminButtons] = useState(() => {
    // If authenticated as admin, always show buttons
    if (isAuthenticated && isAdmin) {
      return true;
    }
    // Otherwise check localStorage for toggle state
    const stored = localStorage.getItem(ADMIN_BUTTONS_STORAGE_KEY);
    return stored === 'true';
  });
  
  const [tapCount, setTapCount] = useState(0);
  const tapTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Critical: Automatically show admin buttons when authenticated as admin
  // This effect ensures buttons appear reliably after login completes
  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      // Admin is logged in - ALWAYS show buttons
      setShowAdminButtons(true);
      localStorage.setItem(ADMIN_BUTTONS_STORAGE_KEY, 'true');
    } else if (!isAuthenticated) {
      // Not authenticated - respect localStorage toggle state
      const stored = localStorage.getItem(ADMIN_BUTTONS_STORAGE_KEY);
      setShowAdminButtons(stored === 'true');
    } else if (isAuthenticated && !isAdmin) {
      // Authenticated but not admin - hide buttons
      setShowAdminButtons(false);
      localStorage.setItem(ADMIN_BUTTONS_STORAGE_KEY, 'false');
    }
  }, [isAuthenticated, isAdmin]);

  const handleLogoInteraction = () => {
    // Prevent toggling when authenticated as admin - buttons should always be visible
    if (isAuthenticated && isAdmin) {
      return;
    }

    const newTapCount = tapCount + 1;
    setTapCount(newTapCount);

    if (tapTimeoutRef.current) {
      clearTimeout(tapTimeoutRef.current);
    }

    if (newTapCount >= 6) {
      const newState = !showAdminButtons;
      setShowAdminButtons(newState);
      setTapCount(0);
      localStorage.setItem(ADMIN_BUTTONS_STORAGE_KEY, newState.toString());
      toast.success(newState ? 'Admin controls revealed' : 'Admin controls hidden');
    } else {
      tapTimeoutRef.current = setTimeout(() => {
        setTapCount(0);
      }, 2000);
    }
  };

  useEffect(() => {
    return () => {
      if (tapTimeoutRef.current) {
        clearTimeout(tapTimeoutRef.current);
      }
    };
  }, []);

  return {
    showAdminButtons,
    handleLogoInteraction
  };
}
