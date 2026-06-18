import React from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { LogIn, LogOut } from 'lucide-react';

export default function LoginButton() {
  const { login, clear, loginStatus, identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  const isAuthenticated = !!identity;
  const disabled = loginStatus === 'logging-in';
  const text = loginStatus === 'logging-in' ? 'Logging in...' : isAuthenticated ? 'Logout' : 'Login';

  const handleAuth = async () => {
    if (isAuthenticated) {
      // Logout: clear all state
      await clear();
      queryClient.clear();
      localStorage.removeItem('admin-buttons-visible');
    } else {
      // Login: attempt authentication
      try {
        await login();
        // After successful login, set localStorage to show admin buttons
        // This ensures buttons are visible immediately for admin users
        localStorage.setItem('admin-buttons-visible', 'true');
        
        // Invalidate admin status query to trigger refresh
        await queryClient.invalidateQueries({ queryKey: ['isAdmin'] });
        
        // Force refetch of admin status to ensure it's up to date
        await queryClient.refetchQueries({ queryKey: ['isAdmin'] });
      } catch (error: any) {
        console.error('Login error:', error);
        if (error.message === 'User is already authenticated') {
          // Handle edge case where user is already authenticated
          await clear();
          setTimeout(() => login(), 300);
        }
      }
    }
  };

  return (
    <Button
      onClick={handleAuth}
      disabled={disabled}
      variant={isAuthenticated ? "outline" : "default"}
      size="sm"
      className="flex items-center gap-2"
    >
      {isAuthenticated ? <LogOut className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
      {text}
    </Button>
  );
}
