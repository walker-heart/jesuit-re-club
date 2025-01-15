import { useState, useRef, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  MapPin,
  Clock,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Trash2,
  Plus
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { EventModal } from "@/components/modals/EventModal";
import { DeleteModal } from "@/components/modals/DeleteModal";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { fetchEvents, deleteEvent, type FirebaseEvent } from "@/lib/firebase/events";

// Use the FirebaseEvent type from firebase/events
type Event = FirebaseEvent;

export function Events() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [upcomingPage, setUpcomingPage] = useState(1);
  const [pastPage, setPastPage] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingEvent, setDeletingEvent] = useState<Event | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const upcomingRef = useRef<HTMLDivElement | null>(null);
  const pastRef = useRef<HTMLDivElement | null>(null);
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);

  // Add scroll to section functionality
  useEffect(() => {
    // Check URL hash and scroll to appropriate section
    if (window.location.hash && !isLoadingEvents) {
      const targetRef = {
        '#past': pastRef,
        '#upcoming': upcomingRef
      }[window.location.hash];

      if (targetRef?.current) {
        const yOffset = targetRef.current.getBoundingClientRect().top + window.pageYOffset - 100;
        window.scrollTo({ top: yOffset, behavior: 'smooth' });
      }
    }
  }, [isLoadingEvents]); // Run when loading is complete

  const canModifyEvent = (event: Event) => {
    if (!user) return false;
    
    // Admins can modify all events
    if (user.role === 'admin') return true;
    
    // Editors can only modify their own events
    if (user.role === 'editor') {
      return event.userId === user.uid;
    }
    
    return false;
  };

  const handleDelete = async (event: Event) => {
    if (!canModifyEvent(event)) {
      toast({
        title: "Permission Denied",
        description: "You don't have permission to delete this event",
        variant: "destructive"
      });
      return;
    }

    setDeletingEvent(event);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingEvent?.id) return;

    try {
      setIsDeleting(true);
      await deleteEvent(deletingEvent.id);
      
      // Refresh the events list
      const fetchedEvents = await fetchEvents();
      setAllEvents(fetchedEvents);
      
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

  useEffect(() => {
    const loadEvents = async () => {
      try {
        setIsLoadingEvents(true);
        const events = await fetchEvents();
        setAllEvents(events);
      } catch (error: any) {
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

    loadEvents();
  }, []);

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

  const totalUpcomingPages = Math.ceil(allUpcomingEvents.length / eventsPerPage);
  const totalPastPages = Math.ceil(allPastEvents.length / eventsPerPage);

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const EventCard = ({ event, index }: { event: Event; index: number }) => (
    <Link href={`/events/${event.id}`}>
      <Card
        className="overflow-hidden transition-all duration-300 hover:shadow-lg animate-fade-in cursor-pointer hover:scale-[1.02] relative"
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
                  <span>{formatTime(event.time)}</span>
                </div>
                <div className="flex items-center">
                  <MapPin className="mr-2 h-4 w-4" />
                  <span>{event.location}</span>
                </div>
              </div>
              <p className="text-gray-600">{event.speakerDescription}</p>
            </div>
            {canModifyEvent(event) && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={(e) => {
                    e.preventDefault(); // Prevent navigation
                    setEditingEvent(event);
                    setIsDialogOpen(true);
                  }}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={(e) => {
                    e.preventDefault(); // Prevent navigation
                    handleDelete(event);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
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
    <div className="w-full py-8 md:py-12 lg:py-8">
      <div className="container px-4 md:px-6 mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#003c71] mb-2 animate-fade-in">Events</h1>
            <p className="text-gray-600 animate-slide-up">
              View upcoming and past events
            </p>
          </div>
          {user && (user.role === 'admin' || user.role === 'editor') && (
            <Button 
              onClick={() => {
                setEditingEvent(null);
                setIsDialogOpen(true);
              }}
              className="bg-[#003c71] hover:bg-[#002855] text-white flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Create Event
            </Button>
          )}
        </div>

        <EventModal
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          event={editingEvent}
          onSuccess={async () => {
            const fetchedEvents = await fetchEvents();
            setAllEvents(fetchedEvents);
          }}
        />

        <DeleteModal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setDeletingEvent(null);
          }}
          onConfirm={handleConfirmDelete}
          title="Delete Event"
          message={`Are you sure you want to delete "${deletingEvent?.title}"? This action cannot be undone.`}
          isDeleting={isDeleting}
        />

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
    </div>
  );
}