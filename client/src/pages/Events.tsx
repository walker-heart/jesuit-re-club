import { useState, useRef } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface Event {
  id: number;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
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
  const allUpcomingEvents: Event[] = [
    {
      id: 1,
      title: "Guest Speaker: John Doe",
      date: "May 15, 2024",
      time: "4:00 PM",
      location: "Jesuit Dallas Auditorium",
      description:
        "Join us for an insightful talk on commercial real estate trends with industry expert John Doe.",
    },
    {
      id: 2,
      title: "Real Estate Market Analysis Workshop",
      date: "June 1, 2024",
      time: "3:30 PM",
      location: "Room 201",
      description:
        "Learn how to analyze real estate markets and identify investment opportunities in this hands-on workshop.",
    },
    {
      id: 5,
      title: "Property Valuation Seminar",
      date: "June 15, 2024",
      time: "2:00 PM",
      location: "Conference Room A",
      description:
        "Learn the fundamentals of property valuation from experienced appraisers.",
    },
    {
      id: 6,
      title: "Real Estate Tech Innovation Showcase",
      date: "July 1, 2024",
      time: "1:00 PM",
      location: "Innovation Lab",
      description:
        "Explore cutting-edge technologies shaping the future of real estate.",
    },
  ];

  const allPastEvents: Event[] = [
    {
      id: 3,
      title: "Downtown Dallas Property Tour",
      date: "April 15, 2024",
      time: "10:00 AM",
      location: "Downtown Dallas",
      description:
        "Members explored prime commercial properties in downtown Dallas with industry professionals.",
    },
    {
      id: 4,
      title: "Real Estate Investment Strategies Seminar",
      date: "March 30, 2024",
      time: "3:00 PM",
      location: "Seminar Room 101",
      description:
        "Expert panel discussion on various real estate investment strategies and market opportunities.",
    },
    {
      id: 7,
      title: "Networking Mixer with Industry Leaders",
      date: "March 1, 2024",
      time: "5:00 PM",
      location: "Student Center",
      description:
        "Students connected with Dallas's top real estate professionals in an informal networking session.",
    },
    {
      id: 8,
      title: "Sustainable Development Symposium",
      date: "February 15, 2024",
      time: "2:00 PM",
      location: "Green Building Center",
      description:
        "Discussion on eco-friendly practices and sustainable development in real estate.",
    },
  ];

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
    sectionRef: React.RefObject<HTMLElement>;
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
        {(user?.role === "admin" || user?.role === "editor") && (
          <div className="mb-8">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-[#003c71] text-white hover:bg-[#002c61] button-hover">
                  Create New Event
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Event</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Event Title
                    </label>
                    <Input
                      value={newEvent.title}
                      onChange={(e) =>
                        setNewEvent({ ...newEvent, title: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Description
                    </label>
                    <Textarea
                      value={newEvent.description}
                      onChange={(e) =>
                        setNewEvent({
                          ...newEvent,
                          description: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Date
                    </label>
                    <Input
                      type="date"
                      value={newEvent.date}
                      onChange={(e) =>
                        setNewEvent({ ...newEvent, date: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Time
                    </label>
                    <Input
                      type="time"
                      value={newEvent.time}
                      onChange={(e) =>
                        setNewEvent({ ...newEvent, time: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Location
                    </label>
                    <Input
                      value={newEvent.location}
                      onChange={(e) =>
                        setNewEvent({ ...newEvent, location: e.target.value })
                      }
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-[#003c71] text-white hover:bg-[#002c61] button-hover"
                  >
                    Create Event
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
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
