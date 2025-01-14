'use client'

import { useState, useEffect } from 'react'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { EventModal } from '@/components/admin/EventModal'
import { fetchEvents, deleteEvent, createEvent, updateEvent, type FirebaseEvent } from '@/lib/firebase/events'
import { useToast } from '@/hooks/use-toast'
import { auth } from '@/lib/firebase/firebase-config'
import { Plus, Edit, Trash2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { formatTime } from "@/lib/utils/time";

export function EventsTab() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('')
  const [events, setEvents] = useState<FirebaseEvent[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [editingEvent, setEditingEvent] = useState<FirebaseEvent | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    loadEvents()
  }, [])

  const loadEvents = async () => {
    try {
      setIsLoading(true)
      const fetchedEvents = await fetchEvents()
      setEvents(fetchedEvents)
    } catch (error: any) {
      console.error('Error loading events:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to load events",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      if (!auth.currentUser) {
        toast({
          title: "Error",
          description: "You must be logged in to delete events",
          variant: "destructive"
        });
        return;
      }

      // Find the event and check permissions
      const event = events.find(e => e.id === id);
      if (!event) return;

      const canDelete = user?.role === 'admin' || 
                       (user?.role === 'editor' && event.userId === auth.currentUser.uid);

      if (!canDelete) {
        toast({
          title: "Access Denied",
          description: "You don't have permission to delete this event",
          variant: "destructive"
        });
        return;
      }

      if (!window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
        return;
      }

      await deleteEvent(id);
      await loadEvents(); // Refresh the list after deletion

      toast({
        title: "Success",
        description: "Event deleted successfully"
      });
    } catch (error: any) {
      console.error('Error deleting event:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete event",
        variant: "destructive"
      });
    }
  };

  const handleEventCreated = async (eventData: Partial<FirebaseEvent>) => {
    try {
      if (!user) {
        throw new Error('You must be logged in to manage events');
      }

      if (editingEvent) {
        // Update existing event
        await updateEvent({
          ...editingEvent,
          ...eventData,
          updatedAt: new Date().toISOString(),
          updatedBy: user.firstName && user.lastName 
            ? `${user.firstName} ${user.lastName}`
            : user.email || 'Unknown user'
        } as FirebaseEvent);
      } else {
        // Create new event
        await createEvent({
          ...eventData,
          userId: user.uid,
          userCreated: user.firstName && user.lastName 
            ? `${user.firstName} ${user.lastName}`
            : user.email || 'Unknown user',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          updatedBy: user.firstName && user.lastName 
            ? `${user.firstName} ${user.lastName}`
            : user.email || 'Unknown user'
        } as FirebaseEvent);
      }

      // Refresh the events list
      await loadEvents();

      toast({
        title: "Success",
        description: editingEvent ? "Event updated successfully" : "Event created successfully"
      });
      
      setIsModalOpen(false);
      setEditingEvent(null);
    } catch (error: any) {
      console.error('Error saving event:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save event",
        variant: "destructive"
      });
    }
  };

  const filteredEvents = events.filter(event => {
    const searchLower = searchTerm.toLowerCase();
    return event.title.toLowerCase().includes(searchLower) || 
           event.speaker.toLowerCase().includes(searchLower) ||
           event.location.toLowerCase().includes(searchLower);
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Input
          type="text"
          placeholder="Search events..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Button 
          onClick={() => {
            setEditingEvent(null);
            setIsModalOpen(true);
          }}
          className="bg-[#003c71] hover:bg-[#002855] text-white flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Create Event
        </Button>
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Date & Time</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Speaker</TableHead>
              <TableHead>Created By</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <div className="flex items-center justify-center text-sm text-muted-foreground">
                    Loading events...
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredEvents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <div className="flex flex-col items-center justify-center text-sm text-muted-foreground">
                    <p>No events found</p>
                    {searchTerm && <p className="mt-1">Try adjusting your search</p>}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredEvents.map((event) => (
                <TableRow key={event.id}>
                  <TableCell className="font-medium">{event.title}</TableCell>
                  <TableCell>{`${event.date} at ${formatTime(event.time)}`}</TableCell>
                  <TableCell>{event.location}</TableCell>
                  <TableCell>{event.speaker}</TableCell>
                  <TableCell>{event.userCreated}</TableCell>
                  <TableCell>{event.createdAt}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {user && (user.role === 'admin' || event.userId === auth.currentUser?.uid) && (
                        <>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => {
                              setEditingEvent(event);
                              setIsModalOpen(true);
                            }}
                            className="flex items-center gap-2"
                          >
                            <Edit className="h-4 w-4" />
                            Edit
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm" 
                            onClick={() => event.id && handleDelete(event.id)}
                            className="flex items-center gap-2"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <EventModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingEvent(null);
        }}
        onEventCreated={handleEventCreated}
        event={editingEvent}
      />
    </div>
  );
}
