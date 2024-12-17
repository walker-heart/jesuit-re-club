import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  MapPin,
  Clock,
  ChevronLeft,
  ChevronRight,
  Edit,
  Trash2,
} from "lucide-react";
import { EditModal } from "@/components/admin/EditModal";
import { deleteEvent, fetchEvents, type FirebaseEvent } from "@/lib/firebase/events";
import { auth } from "@/lib/firebase/firebase-config";
import { Card, CardContent } from "@/components/ui/card";
import { EventModal } from "@/components/admin/EventModal";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

// Use the FirebaseEvent type from firebase/events
type Event = FirebaseEvent & {
  description?: string; // Optional since we map speakerDescription to this
};

export function Events() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [upcomingPage, setUpcomingPage] = useState(1);
  const [pastPage, setPastPage] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const upcomingRef = useRef<HTMLDivElement | null>(null);
  const pastRef = useRef<HTMLDivElement | null>(null);

  const canModifyEvent = (event: Event) => {
    if (!auth.currentUser) return false;
    
    const userRole = localStorage.getItem('userRole');
    
    // Admins can modify all events
    if (userRole === 'admin') return true;
    
    // Editors can only modify their own events
    if (userRole === 'editor') {
      return event.userCreated === (auth.currentUser.displayName || auth.currentUser.email);
    }
    
    return false;
  };

  const handleDelete = async (event: Event) => {
    if (!event.id || !canModifyEvent(event)) return;

    if (!window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteEvent(event.id);
      
      toast({
        title: "Success",
        description: "Event deleted successfully"
      });
      
      // Refresh the events list
      const fetchedEvents = await fetchEvents();
      setAllEvents(fetchedEvents);
    } catch (error: any) {
      console.error('Error deleting event:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete event",
        variant: "destructive"
      });
    }
  };

  const handleEventUpdated = async () => {
    try {
      // Refresh the events list after update
      const fetchedEvents = await fetchEvents();
      setAllEvents(fetchedEvents);
      setIsEditModalOpen(false);
      setEditingEvent(null);
      
      toast({
        title: "Success",
        description: "Event updated successfully"
      });
    } catch (error) {
      console.error('Error refreshing events:', error);
      toast({
        title: "Error",
        description: "Failed to refresh events",
        variant: "destructive"
      });
    }
  };
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    location: "",
  });
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setIsLoadingEvents(true);
        const response = await fetch('/api/events', {
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error('Failed to fetch events');
        }

        const data = await response.json();
        const events = data.events.map((event: FirebaseEvent) => ({
          ...event,
          description: event.speakerDescription // Map speakerDescription to description for display
        }));

        setAllEvents(events);
      } catch (error) {
        console.error('Error fetching events:', error);
        toast({
          title: "Error",
          description: "Failed to load events",
          variant: "destructive"
        });
      } finally {
        setIsLoadingEvents(false);
      }
    };

    fetchEvents();
  }, [user]);

  // Split events into upcoming and past based on date
  const currentDate = new Date();
  const allUpcomingEvents = allEvents.filter(event => {
    const eventDate = new Date(`${event.date} ${event.time}`);
    return eventDate >= currentDate;
  });

  const allPastEvents = allEvents.filter(event => {
    const eventDate = new Date(`${event.date} ${event.time}`);
    return eventDate < currentDate;
  });

  const eventsPerPage = 3;
  const indexOfLastUpcoming = upcomingPage * eventsPerPage;
  const indexOfFirstUpcoming = indexOfLastUpcoming - eventsPerPage;
  const currentUpcomingEvents = allUpcomingEvents.slice(
    indexOfFirstUpcoming,
    indexOfLastUpcoming,
  );

  const indexOfLastPast = pastPage * eventsPerPage;
  const indexOfFirstPast = indexOfLastPast - eventsPerPage;
  const currentPastEvents = allPastEvents.slice(
    indexOfFirstPast,
    indexOfLastPast,
  );

  const totalUpcomingPages = Math.ceil(
    allUpcomingEvents.length / eventsPerPage,
  );
  const totalPastPages = Math.ceil(allPastEvents.length / eventsPerPage);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // TODO: Implement event creation logic
      toast({
        title: "Success",
        description: "Event created successfully",
      });
      setNewEvent({
        title: "",
        description: "",
        date: "",
        time: "",
        location: "",
      });
      setIsDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create event",
        variant: "destructive",
      });
    }
  };

  const EventCard = ({ event, index }: { event: Event; index: number }) => (
    <Card
      className="animate-fade-in card-hover"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h3 className="text-xl font-bold text-[#003c71] mb-2">
              {event.title}
            </h3>
            <div className="flex flex-col sm:flex-row gap-4 text-gray-500 mb-2">
              <div className="flex items-center">
                <Calendar className="mr-2 h-4 w-4" />
                <span>{event.date}</span>
              </div>
              <div className="flex items-center">
                <Clock className="mr-2 h-4 w-4" />
                <span>{event.time}</span>
              </div>
              <div className="flex items-center">
                <MapPin className="mr-2 h-4 w-4" />
                <span>{event.location}</span>
              </div>
            </div>
            <p className="text-gray-600">{event.description}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              asChild
              className="bg-[#b3a369] text-[#003c71] hover:bg-[#b3a369]/90 button-hover shrink-0"
            >
              <Link href={`/events/${event.id}`}>View Details →</Link>
            </Button>
            {canModifyEvent(event) && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    setEditingEvent(event);
                    setIsEditModalOpen(true);
                  }}
                  className="flex items-center gap-2"
                >
                  <Edit className="h-4 w-4" />
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    handleDelete(event);
                  }}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const Pagination = ({
    currentPage,
    totalPages,
    setPage,
    label,
    sectionRef,
  }: {
    currentPage: number;
    totalPages: number;
    setPage: (page: number) => void;
    label: string;
    sectionRef: React.RefObject<HTMLDivElement | null>;
  }) => {
    const handlePageChange = (newPage: number) => {
      setPage(newPage);
      if (sectionRef.current) {
        const yOffset =
          sectionRef.current.getBoundingClientRect().top +
          window.pageYOffset -
          100;
        window.scrollTo({ top: yOffset, behavior: "smooth" });
      }
    };

    return (
      <div className="flex justify-center items-center space-x-4 mt-8">
        <Button
          onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
          disabled={currentPage === 1}
          variant="outline"
          className="text-[#003c71] button-hover"
        >
          <ChevronLeft className="mr-2 h-4 w-4" /> Previous
        </Button>
        <span className="text-[#003c71]">
          {label} {currentPage} of {totalPages}
        </span>
        <Button
          onClick={() =>
            handlePageChange(Math.min(currentPage + 1, totalPages))
          }
          disabled={currentPage === totalPages}
          variant="outline"
          className="text-[#003c71] button-hover"
        >
          Next <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    );
  };

  return (
    <div className="w-full py-4">
      <div className="container px-4 mx-auto">
        <div className="w-full flex justify-end mb-4">
          {(user?.role === 'admin' || user?.role === 'editor') && (
            <>
              <EventModal 
                isOpen={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
                onEventCreated={(event) => {
                  // Refresh the events list after creation
                  toast({
                    title: "Success",
                    description: "Event created successfully"
                  });
                  // TODO: Update events list
                  setIsDialogOpen(false);
                }}
              />
              <Button 
                onClick={() => setIsDialogOpen(true)}
                className="bg-[#003c71] text-white hover:bg-[#002c61]"
              >
                Create New Event
              </Button>
            </>
          )}
        </div>

        <div className="space-y-12">
          <section ref={upcomingRef}>
            <h2 className="text-2xl font-bold text-[#003c71] mb-6 animate-fade-in">
              Upcoming Events
            </h2>
            <div className="grid gap-8">
              {currentUpcomingEvents.map((event, index) => (
                <EventCard key={event.id} event={event} index={index} />
              ))}
            </div>
            {allUpcomingEvents.length > eventsPerPage && (
              <Pagination
                currentPage={upcomingPage}
                totalPages={totalUpcomingPages}
                setPage={setUpcomingPage}
                label="Page"
                sectionRef={upcomingRef}
              />
            )}
          </section>

          <section ref={pastRef}>
            <h2 className="text-2xl font-bold text-[#003c71] mb-6 animate-fade-in">
              Past Events
            </h2>
            <div className="grid gap-8">
              {currentPastEvents.map((event, index) => (
                <EventCard key={event.id} event={event} index={index} />
              ))}
            </div>
            {allPastEvents.length > eventsPerPage && (
              <Pagination
                currentPage={pastPage}
                totalPages={totalPastPages}
                setPage={setPastPage}
                label="Page"
                sectionRef={pastRef}
              />
            )}
          </section>
        </div>
      </div>

      {/* Edit Modal */}
      {editingEvent && (
        <EditModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingEvent(null);
          }}
          onSave={handleEventUpdated}
          item={{
            ...editingEvent,
            speakerDescription: editingEvent.description || editingEvent.speakerDescription
          }}
          type="event"
        />
      )}
    </div>
  );
}
