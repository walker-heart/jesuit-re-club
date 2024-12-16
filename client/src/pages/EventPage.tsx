import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, MapPin, Clock } from "lucide-react";

export function EventPage() {
  const { slug } = useParams();
  
  // In a real application, we would fetch the event data based on the slug
  // For now, using mock data
  const event = {
    id: 1,
    title: "Guest Speaker: John Doe",
    date: "May 15, 2023",
    time: "4:00 PM",
    location: "Jesuit Dallas Auditorium",
    description: "Join us for an insightful talk on commercial real estate trends with industry expert John Doe.",
    details: `
      John Doe, a veteran in commercial real estate with over 20 years of experience, 
      will share insights on current market trends, investment strategies, and future 
      opportunities in the Dallas-Fort Worth commercial real estate market.
      
      Topics to be covered:
      - Current state of commercial real estate in DFW
      - Emerging trends in property development
      - Investment strategies for different market conditions
      - Risk management in commercial real estate
      
      Don't miss this opportunity to learn from one of the industry's leading experts!
    `
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-[#003c71]">{event.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4 text-gray-600">
            <div className="flex items-center">
              <Calendar className="mr-2 h-5 w-5" />
              <span>{event.date}</span>
            </div>
            <div className="flex items-center">
              <Clock className="mr-2 h-5 w-5" />
              <span>{event.time}</span>
            </div>
            <div className="flex items-center">
              <MapPin className="mr-2 h-5 w-5" />
              <span>{event.location}</span>
            </div>
          </div>
          
          <div className="prose max-w-none">
            <p className="text-lg">{event.description}</p>
            <div className="mt-6 whitespace-pre-line">
              {event.details}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
