import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { createUser, updateUser, deleteUser, fetchUsers } from '@/lib/firebase/users';
import type { FirebaseUser } from '@/lib/firebase/users';

export function useUsers() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleCreate = async (userData: Omit<FirebaseUser, 'uid'>) => {
    setIsLoading(true);
    try {
      await createUser(userData);
      toast({
        title: 'Success',
        description: 'User created successfully',
      });
    } catch (error) {
      console.error('Error creating user:', error);
      toast({
        title: 'Error',
        description: 'Failed to create user',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async (uid: string, userData: Partial<FirebaseUser>) => {
    setIsLoading(true);
    try {
      await updateUser(uid, userData);
      toast({
        title: 'Success',
        description: 'User updated successfully',
      });
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        title: 'Error',
        description: 'Failed to update user',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (uid: string) => {
    setIsLoading(true);
    try {
      await deleteUser(uid);
      toast({
        title: 'Success',
        description: 'User deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete user',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleFetch = async () => {
    setIsLoading(true);
    try {
      const users = await fetchUsers();
      return users;
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch users',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    createUser: handleCreate,
    updateUser: handleUpdate,
    deleteUser: handleDelete,
    fetchUsers: handleFetch,
  };
} 