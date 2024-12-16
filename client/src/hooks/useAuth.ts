import { useState } from 'react';
import { type User, type LoginCredentials, type AuthResponse } from '@/lib/types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useAuth() {
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  const { data: user, error } = useQuery<User | null>({
    queryKey: ['/api/auth/session'],
    retry: false,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    onSuccess: () => setIsLoading(false),
    onError: () => {
      setIsLoading(false);
      return null;
    }
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
        throw new Error(await res.text());
      }
      
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/session'] });
    },
  });

  const logout = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      
      if (!res.ok) {
        throw new Error(await res.text());
      }
      
      return res.json();
    },
    onSuccess: () => {
      queryClient.setQueryData(['/api/auth/session'], null);
    },
  });

  return {
    user,
    isLoading,
    isError: !!error,
    login: login.mutate,
    logout: logout.mutate,
    isLoggingIn: login.isPending,
    isLoggingOut: logout.isPending,
    loginError: login.error,
  };
}
