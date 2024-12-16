import { useParams, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, MapPin, Clock, ArrowLeft } from "lucide-react";

export function EventPage() {
  const { slug } = useParams();
  
  // In a real application, we would fetch the event data based on the slug
  // For now, using mock data
  const event = {
    id: slug,
    title: "Guest Speaker: John Doe",
    date: "May 15, 2024",
    time: "4:00 PM",
    description: "Join us for an insightful talk on commercial real estate trends with industry expert John Doe.",
    location: "Jesuit Dallas Auditorium",
    speaker: "John Doe",
    speakerBio: "John Doe is a renowned real estate expert with over 20 years of experience in commercial real estate.",
    agenda: [
      "3:30 PM - Check-in and networking",
      "4:00 PM - Welcome remarks",
      "4:15 PM - Guest speaker presentation",
      "5:15 PM - Q&A session",
      "5:45 PM - Closing remarks and networking"
    ]
  };

  return (
    <div className="min-h-screen bg-gray-100 py-24">
      <div className="container mx-auto px-4">
        <Button asChild variant="outline" className="mb-6 button-hover">
          <Link href="/events">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Events
          </Link>
        </Button>
        
        <div className="bg-white rounded-lg shadow-lg p-8 animate-fade-in">
          <h1 className="text-3xl font-bold text-[#003c71] mb-4">{event.title}</h1>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <div className="flex items-center text-gray-600 mb-4">
                <Calendar className="mr-2 h-5 w-5" />
                <span>{event.date}</span>
              </div>
              <div className="flex items-center text-gray-600 mb-4">
                <Clock className="mr-2 h-5 w-5" />
                <span>{event.time}</span>
              </div>
              <div className="flex items-center text-gray-600 mb-6">
                <MapPin className="mr-2 h-5 w-5" />
                <span>{event.location}</span>
              </div>
              
              <p className="text-gray-700 mb-6">{event.description}</p>
              
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-[#003c71]">Speaker</h2>
                <p className="text-gray-700 font-semibold">{event.speaker}</p>
                <p className="text-gray-600">{event.speakerBio}</p>
              </div>
            </div>
            
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-[#003c71] mb-4">Agenda</h2>
                <ul className="list-disc list-inside text-gray-700 space-y-2">
                  {event.agenda.map((item, index) => (
                    <li key={index} className="pl-2">{item}</li>
                  ))}
                </ul>
              </div>
              
              <Button className="w-full bg-[#b3a369] text-[#003c71] hover:bg-[#b3a369]/90 mt-8 button-hover">
                Register Now
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
