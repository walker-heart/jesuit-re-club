import { useState, useEffect } from "react";
import { useParams, Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Clock, ArrowLeft, Edit2, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/lib/firebase/firebase-config";
import { EventModal } from "@/components/modals/EventModal";
import { deleteEvent as deleteEventInFirebase, type FirebaseEvent } from "@/lib/firebase/events";
import { formatTime } from "@/lib/utils/time";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/firebase-config";

interface EventDetails extends FirebaseEvent {
  id: string;
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
      return event.userId === user.uid;
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
      
      await deleteEventInFirebase(event.id);
      
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
      if (!slug) throw new Error('Event ID is required');
      const docRef = doc(db, 'events', slug);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        throw new Error('Event not found');
      }
      
      const data = docSnap.data();
      setEvent({
        id: docSnap.id,
        ...data
      } as EventDetails);
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
          <div className="flex justify-between items-start mb-6">
            <h1 className="text-2xl font-bold text-[#003c71]">{event.title}</h1>
            {canModifyEvent() && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setIsEditModalOpen(true)}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleDelete}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center text-gray-600">
                  <Calendar className="mr-2 h-5 w-5" />
                  <span>{event.date}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Clock className="mr-2 h-5 w-5" />
                  <span>{formatTime(event.time)}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <MapPin className="mr-2 h-5 w-5" />
                  <span>{event.location}</span>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-[#003c71] mb-3">Speaker</h2>
                <p className="text-gray-700 font-medium mb-2">{event.speaker}</p>
                <p className="text-gray-600">{event.speakerDescription}</p>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-[#003c71] mb-3">Agenda</h2>
              <div className="space-y-2">
                {agendaItems.map((item, index) => (
                  <p key={index} className="text-gray-600">{item}</p>
                ))}
              </div>
              <div className="flex justify-end mt-6">
                {event.url && (
                  <Button
                    variant="outline"
                    className="w-48 bg-white hover:bg-[#B4975A] hover:text-white border-[#B4975A] text-[#B4975A]"
                    onClick={() => window.open(event.url, '_blank')}
                  >
                    View Speaker Bio
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Event Modal */}
      {event && (
        <EventModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          event={event}
          onSuccess={fetchEvent}
        />
      )}
    </div>
  );
}