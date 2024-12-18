import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar } from 'lucide-react'
import { EventModal } from '../admin/EventModal'
import { useToast } from "@/hooks/use-toast"
import { useAuth } from '@/hooks/useAuth'
import { auth } from '@/lib/firebase/firebase-config'
import { fetchEvents, deleteEvent, type FirebaseEvent } from '@/lib/firebase/events'

export function EditorEventsTab() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [events, setEvents] = useState<FirebaseEvent[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<FirebaseEvent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEvents = async () => {
    try {
      if (!auth.currentUser) {
        setError("User not authenticated");
        return;
      }
      
      setIsLoading(true);
      setError(null); // Clear any previous errors
      
      const allEvents = await fetchEvents();
      
      // Filter events to only show those created by the current user
      const userEvents = allEvents.filter(event => 
        event.userCreated === auth.currentUser?.displayName || 
        event.userCreated === auth.currentUser?.email
      );

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
    } catch (error: any) {
      console.error('Error loading events:', error);
      setError(error.message || "Failed to load events");
      toast({
        title: "Error",
        description: error.message || "Failed to load events",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (auth.currentUser) {
      loadEvents();
    }
  }, [auth.currentUser]);

  const handleDelete = async (id: string) => {
    try {
      // Find the event and check if the user created it
      const event = events.find(e => e.id === id);
      if (!auth.currentUser) {
        toast({
          title: "Error",
          description: "You must be logged in to delete events",
          variant: "destructive"
        });
        return;
      }

      const isCreator = event?.userCreated === auth.currentUser.displayName || 
                       event?.userCreated === auth.currentUser.email;
      
      if (!event || !isCreator) {
        toast({
          title: "Access Denied",
          description: "You can only delete events you created",
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
      await loadEvents();

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
            ) : error ? (
              <Card className="p-4">
                <p className="text-red-600">Error: {error}</p>
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
                <p className="text-sm text-gray-500 mb-2">Created by: {event.userCreated}</p>
                <div className="absolute bottom-4 right-4 space-x-2">
                  {(event.userCreated === auth.currentUser?.displayName || 
                    event.userCreated === auth.currentUser?.email) && (
                    <>
                      <Button variant="outline" size="sm" onClick={() => {
                        setEditingEvent(event);
                        setIsModalOpen(true);
                      }}>Edit</Button>
                      <Button variant="destructive" size="sm" onClick={() => event.id && handleDelete(event.id)}>Delete</Button>
                    </>
                  )}
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
        onEventCreated={() => {
          // Refresh events after save
          loadEvents();
          setIsModalOpen(false);
          setEditingEvent(null);
        }}
      />
    </div>
  );
}