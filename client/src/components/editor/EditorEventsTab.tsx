import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar } from 'lucide-react'
import { EventModal } from '../admin/EventModal'
import { fetchEvents, deleteEvent } from '@/lib/firebase/events'
import { useToast } from "@/hooks/use-toast"
import { useAuth } from '@/hooks/useAuth'

type EventItem = {
  id?: string;
  title: string;
  date: string;
  time: string;
  location: string;
  speaker: string;
  speakerDescription: string;
  agenda: string;
  createdAt: string;
  userCreated: string;
}

export function EditorEventsTab() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadEvents = async () => {
      try {
        setIsLoading(true);
        const allEvents = await fetchEvents();
        
        // Filter events to only show those created by the current user
        const userEvents = allEvents.filter(event => event.userCreated === user?.username);
        
        // Sort events by date, putting upcoming events first
        const sortedEvents = userEvents.sort((a, b) => {
          const dateA = new Date(`${a.date} ${a.time}`);
          const dateB = new Date(`${b.date} ${b.time}`);
          const now = new Date();
          
          const aIsUpcoming = dateA >= now;
          const bIsUpcoming = dateB >= now;
          
          if (aIsUpcoming === bIsUpcoming) {
            return aIsUpcoming ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime();
          }
          
          return aIsUpcoming ? -1 : 1;
        });

        setEvents(sortedEvents);
      } catch (error) {
        console.error('Error loading events:', error);
        toast({
          title: "Error",
          description: "Failed to load events",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      loadEvents();
    }
  }, [user]);

  const handleDelete = async (id: string) => {
    try {
      // Find the event and check if the user created it
      const event = events.find(e => e.id === id);
      if (!event || event.userCreated !== user?.username) {
        toast({
          title: "Access Denied",
          description: "You can only delete your own events",
          variant: "destructive"
        });
        return;
      }

      // Confirm deletion
      if (!window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
        return;
      }

      await deleteEvent(id);
      
      // Refresh the events list
      const updatedEvents = await fetchEvents();
      const userEvents = updatedEvents.filter(event => event.userCreated === user?.username);
      const sortedEvents = userEvents.sort((a, b) => {
        const dateA = new Date(`${a.date} ${a.time}`);
        const dateB = new Date(`${b.date} ${b.time}`);
        const now = new Date();
        const aIsUpcoming = dateA >= now;
        const bIsUpcoming = dateB >= now;
        
        if (aIsUpcoming === bIsUpcoming) {
          return aIsUpcoming ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime();
        }
        return aIsUpcoming ? -1 : 1;
      });

      setEvents(sortedEvents);
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

  return (
    <div className="grid grid-cols-1 gap-6">
      <Card className="col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Calendar className="mr-2" />
              My Events
            </div>
            <Button onClick={() => setIsModalOpen(true)}>
              Create Event
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {isLoading ? (
              <Card className="p-4">
                <p className="text-gray-600">Loading events...</p>
              </Card>
            ) : events.length === 0 ? (
              <Card className="p-4">
                <p className="text-gray-600">No events found</p>
              </Card>
            ) : events.map((event) => (
              <Card key={event.id} className="p-4 relative">
                <h3 className="text-lg font-semibold text-[#003c71] mb-2">{event.title}</h3>
                <p className="text-sm text-gray-600 mb-1">{event.date} | {event.time}</p>
                <p className="text-sm text-gray-600 mb-2">{event.location}</p>
                <p className="text-sm text-gray-600 mb-2">Speaker: {event.speaker}</p>
                <div className="absolute bottom-4 right-4 space-x-2">
                  <Button variant="outline" size="sm" onClick={() => {
                    setEditingEvent(event);
                    setIsModalOpen(true);
                  }}>Edit</Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(event.id!)}>Delete</Button>
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <EventModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingEvent(null);
        }}
        eventData={editingEvent}
        onSave={async (eventData) => {
          // Refresh events after save
          await loadEvents();
          setIsModalOpen(false);
          setEditingEvent(null);
        }}
      />
    </div>
  );
}
