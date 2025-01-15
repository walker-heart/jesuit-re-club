import { useState, useEffect } from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { EventModal } from '@/components/modals/EventModal'
import { DeleteModal } from '@/components/modals/DeleteModal'
import { fetchEvents, deleteEvent, type FirebaseEvent } from '@/lib/firebase/events'
import { useToast } from "@/hooks/use-toast"
import { useAuth } from '@/hooks/useAuth'
import { Edit2, Trash2, Plus } from 'lucide-react'
import { formatTime } from "@/lib/utils/time";

export function EditorEventsTab() {
  const { user } = useAuth();
  const [events, setEvents] = useState<FirebaseEvent[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const [editingEvent, setEditingEvent] = useState<FirebaseEvent | null>(null)
  const [deletingEvent, setDeletingEvent] = useState<FirebaseEvent | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    if (user) {
      loadEvents()
    }
  }, [user])

  const loadEvents = async () => {
    try {
      if (!user) {
        return;
      }
      
      setIsLoading(true)
      const fetchedEvents = await fetchEvents()
      // Filter events to only show those created by the current user
      const userEvents = fetchedEvents.filter(event => event.userId === user.uid)
      setEvents(userEvents)
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

  const handleDelete = async (event: FirebaseEvent) => {
    try {
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to delete events",
          variant: "destructive"
        });
        return;
      }

      if (event.userId !== user.uid) {
        toast({
          title: "Access Denied",
          description: "You don't have permission to delete this event",
          variant: "destructive"
        });
        return;
      }

      setDeletingEvent(event);
      setIsDeleteModalOpen(true);
    } catch (error: any) {
      console.error('Error preparing to delete event:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to prepare event deletion",
        variant: "destructive"
      });
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingEvent?.id) return;

    try {
      setIsDeleting(true);
      await deleteEvent(deletingEvent.id);
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
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
      setDeletingEvent(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">My Events</h2>
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <div className="col-span-full text-center py-8 text-muted-foreground">
            Loading events...
          </div>
        ) : events.length === 0 ? (
          <div className="col-span-full text-center py-8 text-muted-foreground">
            <p>No events found</p>
            <p className="mt-1">Create your first event using the button above</p>
          </div>
        ) : (
          events.map((event) => (
            <Card key={event.id} className="p-4 relative">
              <h3 className="text-lg font-semibold text-[#003c71] mb-2">{event.title}</h3>
              <p className="text-sm text-gray-600 mb-1">{event.date} | {formatTime(event.time)}</p>
              <p className="text-sm text-gray-600 mb-2">{event.location}</p>
              <p className="text-sm text-gray-600 mb-2">Speaker: {event.speaker}</p>
              <div className="absolute bottom-4 right-4 space-x-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    setEditingEvent(event);
                    setIsModalOpen(true);
                  }}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleDelete(event)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      <EventModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingEvent(null);
        }}
        event={editingEvent}
        onSuccess={loadEvents}
      />

      <DeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeletingEvent(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Event"
        message="Are you sure you want to delete this event? This action cannot be undone."
        isDeleting={isDeleting}
      />
    </div>
  )
}