import { useState, useEffect } from "react";
import { useParams, Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Clock, ArrowLeft, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/lib/firebase/firebase-config";
import { deleteEvent, updateEvent, type FirebaseEvent } from "@/lib/firebase/events";
import { EditModal } from "@/components/admin/EditModal";

type EventDetails = FirebaseEvent & {
  id: string;
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

export function EventPage() {
  const { slug } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [event, setEvent] = useState<EventDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Check if user has permission to edit/delete the event
  const canModifyEvent = () => {
    const user = auth.currentUser;
    if (!user || !event) return false;
    
    // Get user's role from localStorage (set during login)
    const userRole = localStorage.getItem('userRole');
    
    // Admins can modify all events
    if (userRole === 'admin') return true;
    
    // Editors can only modify their own events
    if (userRole === 'editor') {
      return event.userCreated === (user.displayName || user.email);
    }
    
    return false;
  };

  const handleDelete = async () => {
    if (!event?.id || !canModifyEvent()) return;

    if (!window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      return;
    }

    try {
      if (!event.id) {
        throw new Error('Event ID is required for deletion');
      }
      
      await deleteEvent(event.id);
      
      toast({
        title: "Success",
        description: "Event deleted successfully"
      });
      
      // Use setTimeout to ensure the toast is visible before navigation
      setTimeout(() => {
        navigate('/events');
      }, 1500);
    } catch (error: any) {
      console.error('Error deleting event:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete event",
        variant: "destructive"
      });
    }
  };

  // Define fetchEvent outside useEffect so it can be called from other functions
  const fetchEvent = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/events/${slug}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch event details');
      }

      const data = await response.json();
      setEvent(data.event);
    } catch (error) {
      console.error('Error fetching event:', error);
      toast({
        title: "Error",
        description: "Failed to load event details",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEventUpdated = async (updatedEvent: FirebaseEvent) => {
    try {
      if (!updatedEvent.id) {
        throw new Error('Event ID is required for update');
      }
      
      await updateEvent(updatedEvent);
      
      // Refresh the event data after update
      if (slug) {
        await fetchEvent();
      }

      toast({
        title: "Success",
        description: "Event updated successfully"
      });

      setIsEditModalOpen(false);
    } catch (error: any) {
      console.error('Error updating event:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update event",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    if (slug) {
      fetchEvent();
    }
  }, [slug]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-600">Loading event details...</div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-600">Event not found</div>
      </div>
    );
  }

  // Parse agenda string into array if it's a string
  const agendaItems = typeof event.agenda === 'string' 
    ? event.agenda.split('\n').filter(item => item.trim()) 
    : [];

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-24">
        <Button asChild variant="outline" className="mb-6">
          <Link href="/events">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Events
          </Link>
        </Button>
        
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-2xl font-bold text-[#003c71] mb-6">{event.title}</h1>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center text-gray-600">
                  <Calendar className="mr-2 h-5 w-5" />
                  <span>{event.date}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Clock className="mr-2 h-5 w-5" />
                  <span>{event.time}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <MapPin className="mr-2 h-5 w-5" />
                  <span>{event.location}</span>
                </div>
              </div>

              <p className="text-gray-700">{event.speakerDescription}</p>

              <div>
              <h2 className="text-xl font-bold text-[#003c71]">Speaker</h2>
              <p className="text-gray-700">{event.speaker}</p>
            </div>

            {/* Event management buttons for admins and editors */}
            {canModifyEvent() && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditModalOpen(true)}
                  className="flex items-center gap-2"
                >
                  <Edit className="h-4 w-4" />
                  Edit Event
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Event
                </Button>
              </div>
            )}
          </div>

            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-[#003c71] mb-4">Agenda</h2>
                <ul className="space-y-2 text-gray-700">
                  {agendaItems.map((item, index) => (
                    <li key={index} className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>{item.trim()}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Button className="w-full bg-[#b3a369] text-[#003c71] hover:bg-[#b3a369]/90">
                Register Now
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {event && (
        <EditModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSave={async (updatedItem) => {
            if (!event.id) return;
            
            const updatedEvent: FirebaseEvent = {
              ...updatedItem as FirebaseEvent,
              id: event.id,
              userCreated: event.userCreated,
              createdAt: event.createdAt
            };
            
            await handleEventUpdated(updatedEvent);
          }}
          item={event}
          type="event"
        />
      )}
    </div>
  );
}