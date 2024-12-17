import { useState, useRef, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  MapPin,
  Clock,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { EventModal } from "@/components/admin/EventModal";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  speaker: string;
  agenda: string;
  createdAt: string;
  userCreated: string;
}

export function Events() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [upcomingPage, setUpcomingPage] = useState(1);
  const [pastPage, setPastPage] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const upcomingRef = useRef<HTMLDivElement>(null);
  const pastRef = useRef<HTMLDivElement>(null);
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
          credentials: 'include',
          headers: {
            'Authorization': user ? `Bearer ${await user.getIdToken()}` : ''
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch events');
        }

        const data = await response.json();
        const events = data.events.map((event: any) => ({
          id: event.id,
          title: event.title,
          date: event.date,
          time: event.time,
          location: event.location,
          description: event.speakerDescription,
          speaker: event.speaker,
          agenda: event.agenda,
          createdAt: event.createdAt,
          userCreated: event.userCreated
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
          <Button
            asChild
            className="bg-[#b3a369] text-[#003c71] hover:bg-[#b3a369]/90 button-hover shrink-0"
          >
            <Link href={`/events/${event.id}`}>View Details →</Link>
          </Button>
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
    sectionRef: React.RefObject<HTMLDivElement>;
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
    <div className="w-full py-8 md:py-12 lg:py-16">
      <div className="container px-4 md:px-6 mx-auto flex flex-col items-center">
        {(user?.role === "admin" || user?.role === "editor" || false) && (
          <div className="mb-8">
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
              className="bg-[#003c71] text-white hover:bg-[#002c61] button-hover"
            >
              Create New Event
            </Button>
          </div>
        )}

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
