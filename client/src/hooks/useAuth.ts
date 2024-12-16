import { useState } from 'react';
import { type User, type LoginCredentials } from '@/lib/types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useAuth() {
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  const { data: user, error } = useQuery<User | null>({
    queryKey: ['/api/auth/session'],
    retry: false,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchInterval: 5 * 60 * 1000, // Refresh session every 5 minutes
    staleTime: 4.5 * 60 * 1000, // Consider data stale after 4.5 minutes
    onSuccess: () => setIsLoading(false),
    onError: (error) => {
      setIsLoading(false);
      // Only clear session data on 401 Unauthorized
      if (error instanceof Error && error.message.includes('401')) {
        queryClient.setQueryData(['/api/auth/session'], null);
      }
      return null;
    },
  });

  const login = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
        credentials: 'include',
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || 'Login failed');
      }
      
      const data = await res.json();
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['/api/auth/session'], data);
    },
    onError: () => {
      queryClient.setQueryData(['/api/auth/session'], null);
    },
  });

  const logout = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      
      if (!res.ok) {
        throw new Error('Logout failed');
      }
      
      return res.json();
    },
    onSuccess: () => {
      queryClient.setQueryData(['/api/auth/session'], null);
    },
    onSettled: () => {
      // Always refetch session after logout attempt
      queryClient.invalidateQueries({ queryKey: ['/api/auth/session'] });
    },
  });

  return {
    user,
    loading: isLoading,
    isError: !!error,
    login: login.mutate,
    logout: logout.mutate,
    isLoggingIn: login.isPending,
    isLoggingOut: logout.isPending,
    loginError: login.error,
  };
}
