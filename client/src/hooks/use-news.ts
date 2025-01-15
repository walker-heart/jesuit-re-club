import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { createNews, updateNews, deleteNews, fetchNews } from '@/lib/firebase/news';
import type { FirebaseNews } from '@/lib/firebase/types';

export function useNews() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleCreate = async (data: Omit<FirebaseNews, 'id' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy' | 'slug'>) => {
    setIsLoading(true);
    try {
      const news = await createNews(data);
      toast({
        title: 'Success',
        description: 'News created successfully'
      });
      return news;
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create news',
        variant: 'destructive'
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async (id: string, data: Partial<FirebaseNews>) => {
    setIsLoading(true);
    try {
      const news = await updateNews(id, data);
      toast({
        title: 'Success',
        description: 'News updated successfully'
      });
      return news;
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update news',
        variant: 'destructive'
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setIsLoading(true);
    try {
      await deleteNews(id);
      toast({
        title: 'Success',
        description: 'News deleted successfully'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete news',
        variant: 'destructive'
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleFetch = async (userOnly: boolean = false) => {
    setIsLoading(true);
    try {
      const news = await fetchNews(userOnly);
      return news;
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to fetch news',
        variant: 'destructive'
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    createNews: handleCreate,
    updateNews: handleUpdate,
    deleteNews: handleDelete,
    fetchNews: handleFetch
  };
} 