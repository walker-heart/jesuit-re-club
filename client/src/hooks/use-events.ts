import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { createEvent, updateEvent, deleteEvent, fetchEvents } from '@/lib/firebase/events';
import type { FirebaseEvent } from '@/lib/firebase/types';

export function useEvents() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleCreate = async (data: Omit<FirebaseEvent, 'id' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy' | 'slug'>) => {
    setIsLoading(true);
    try {
      const event = await createEvent(data);
      toast({
        title: 'Success',
        description: 'Event created successfully'
      });
      return event;
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create event',
        variant: 'destructive'
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async (id: string, data: Partial<FirebaseEvent>) => {
    setIsLoading(true);
    try {
      const event = await updateEvent(id, data);
      toast({
        title: 'Success',
        description: 'Event updated successfully'
      });
      return event;
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update event',
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
      await deleteEvent(id);
      toast({
        title: 'Success',
        description: 'Event deleted successfully'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete event',
        variant: 'destructive'
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleFetch = async () => {
    setIsLoading(true);
    try {
      const events = await fetchEvents();
      return events;
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to fetch events',
        variant: 'destructive'
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    createEvent: handleCreate,
    updateEvent: handleUpdate,
    deleteEvent: handleDelete,
    fetchEvents: handleFetch
  };
} 