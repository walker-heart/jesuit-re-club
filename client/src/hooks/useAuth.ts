import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { User, LoginCredentials, RegisterCredentials } from '@/lib/types';
import { auth, loginWithEmail, registerWithEmail, logoutUser, getCurrentUser } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setIsLoading(true);
      try {
        if (firebaseUser) {
          const userData = await getCurrentUser(firebaseUser);
          if (userData) {
            setUser(userData);
            queryClient.setQueryData(['user'], userData);
          }
        } else {
          setUser(null);
          queryClient.setQueryData(['user'], null);
        }
      } catch (error) {
        console.error('Error getting user data:', error);
        setUser(null);
        queryClient.setQueryData(['user'], null);
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [queryClient]);

  const login = async ({ email, password }: LoginCredentials) => {
    try {
      const userData = await loginWithEmail(email, password);
      setUser(userData);
      queryClient.setQueryData(['user'], userData);
      return userData;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async ({ email, password, username }: RegisterCredentials) => {
    try {
      const userData = await registerWithEmail(email, password, username);
      setUser(userData);
      queryClient.setQueryData(['user'], userData);
      return userData;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await logoutUser();
      setUser(null);
      queryClient.setQueryData(['user'], null);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  return {
    user,
    loading: isLoading, // add loading alias for backward compatibility
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout
  };
}
