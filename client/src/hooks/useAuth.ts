import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type User } from '@/lib/types';
import { 
  auth,
  loginWithEmail,
  registerWithEmail,
  logoutUser,
  onAuthStateChange,
  getCurrentSession
} from '@/lib/firebase';

export function useAuth() {
  const [isLoading, setIsLoading] = useState(true);
  const [firebaseLoading, setFirebaseLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsubscribe = onAuthStateChange((firebaseUser) => {
      setFirebaseLoading(false);
      if (firebaseUser) {
        queryClient.invalidateQueries({ queryKey: ['user'] });
      } else {
        queryClient.setQueryData(['user'], null);
      }
    });

    return () => unsubscribe();
  }, [queryClient]);

  const { data: user, error } = useQuery<User | null>({
    queryKey: ['user'],
    queryFn: getCurrentSession,
    enabled: !firebaseLoading && !!auth.currentUser,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    retry: false,
  });

  useEffect(() => {
    if (!firebaseLoading) {
      setIsLoading(false);
    }
  }, [firebaseLoading]);

  const login = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      return loginWithEmail(email, password);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });

  const register = useMutation({
    mutationFn: async ({ email, password, username }: { email: string; password: string; username: string }) => {
      return registerWithEmail(email, password, username);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });

  const logout = useMutation({
    mutationFn: logoutUser,
    onSuccess: () => {
      queryClient.setQueryData(['user'], null);
    },
  });

  return {
    user,
    isLoading: isLoading || firebaseLoading,
    isError: !!error,
    login: login.mutate,
    register: register.mutate,
    logout: logout.mutate,
    isLoggingIn: login.isPending,
    isRegistering: register.isPending,
    isLoggingOut: logout.isPending,
    loginError: login.error,
    registerError: register.error,
  };
}
