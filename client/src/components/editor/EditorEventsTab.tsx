import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar } from 'lucide-react'
import { EventModal } from '../admin/EventModal'
import { useToast } from "@/hooks/use-toast"
import { useAuth } from '@/hooks/useAuth'
import { db } from '@/lib/firebase'
import { collection, query, where, getDocs, deleteDoc, doc } from "firebase/firestore"


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
  const [error, setError] = useState<string | null>(null); // Add error state

  const loadEvents = async () => {
    try {
      if (!user) return;
      
      setIsLoading(true);
      setError(null); // Clear any previous errors
      const eventsRef = collection(db, 'events');
      const q = query(eventsRef, where('userCreated', '==', user.email));
      const snapshot = await getDocs(q);
      
      const userEvents = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as EventItem[];

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
      setError(error.message || "Failed to load events"); // Set error message
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
    if (user) {
      loadEvents();
    }
  }, [user, toast]);

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

      const eventRef = doc(db, 'events', id);
      await deleteDoc(eventRef);

      // Refresh the events list
      loadEvents(); // Use the updated loadEvents function
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
            ) : error ? ( // Display error message if present
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