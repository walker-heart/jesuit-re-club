import { useState, useEffect } from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { EventModal } from '@/components/admin/EventModal'
import { fetchEvents, deleteEvent, createEvent, updateEvent, type FirebaseEvent } from '@/lib/firebase/events'
import { useToast } from "@/hooks/use-toast"
import { useAuth } from '@/hooks/useAuth'
import { Edit, Trash2 } from 'lucide-react'
import { formatTime } from "@/lib/utils/time";

export function EditorEventsTab() {
  const { user } = useAuth();
  const [events, setEvents] = useState<FirebaseEvent[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [editingEvent, setEditingEvent] = useState<FirebaseEvent | null>(null)
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

  const handleDelete = async (id: string) => {
    try {
      if (!user) {
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

      if (event.userId !== user.uid) {
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

      // Validate required fields
      const requiredFields = ['title', 'date', 'time', 'location', 'speaker', 'speakerDescription', 'agenda'] as const;
      const missingFields = requiredFields.filter(field => {
        const value = eventData[field];
        return !value || value.toString().trim() === '';
      });
      
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }

      if (editingEvent) {
        // Update existing event
        await updateEvent({
          ...editingEvent,
          ...eventData
        } as FirebaseEvent);
      } else {
        // Create new event
        await createEvent({
          title: eventData.title!,
          date: eventData.date!,
          time: eventData.time!,
          location: eventData.location!,
          speaker: eventData.speaker!,
          speakerDescription: eventData.speakerDescription!,
          agenda: eventData.agenda!,
          userId: user.uid
        });
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

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">My Events</h2>
        <Button 
          onClick={() => {
            setEditingEvent(null);
            setIsModalOpen(true);
          }}
          className="bg-[#003c71] hover:bg-[#002855] text-white"
        >
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
        onEventCreated={handleEventCreated}
        event={editingEvent}
      />
    </div>
  )
}