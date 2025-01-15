import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { createResource, updateResource, deleteResource, fetchResources } from '@/lib/firebase/resources';
import type { FirebaseResource } from '@/lib/firebase/types';

export function useResources() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleCreate = async (resourceData: Omit<FirebaseResource, 'id' | 'createdBy' | 'createdAt' | 'updatedBy' | 'updatedAt'>) => {
    setIsLoading(true);
    try {
      await createResource(resourceData);
      toast({
        title: 'Success',
        description: 'Resource created successfully',
      });
    } catch (error) {
      console.error('Error creating resource:', error);
      toast({
        title: 'Error',
        description: 'Failed to create resource',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async (resourceData: FirebaseResource) => {
    setIsLoading(true);
    try {
      await updateResource(resourceData);
      toast({
        title: 'Success',
        description: 'Resource updated successfully',
      });
    } catch (error) {
      console.error('Error updating resource:', error);
      toast({
        title: 'Error',
        description: 'Failed to update resource',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setIsLoading(true);
    try {
      await deleteResource(id);
      toast({
        title: 'Success',
        description: 'Resource deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting resource:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete resource',
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
      const resources = await fetchResources();
      return resources;
    } catch (error) {
      console.error('Error fetching resources:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch resources',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    createResource: handleCreate,
    updateResource: handleUpdate,
    deleteResource: handleDelete,
    fetchResources: handleFetch,
  };
} 