import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HomeCarousel } from "@/components/HomeCarousel";
import { ArrowDown, ArrowRight, Calendar, Newspaper, UserPlus } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { fetchNews } from "@/lib/firebase/news";
import { fetchEvents } from "@/lib/firebase/events";
import type { FirebaseNews, FirebaseEvent } from "@/lib/firebase/types";
import logo from "@/assets/images/RealEstate-emp-gold.png";

interface OfferCardProps {
  title: string;
  content: string;
  date?: string;
  description: string;
  link: string;
  linkText: string;
  icon: React.ComponentType<{ className?: string }>;
}

export function Home() {
  const { user } = useAuth();
  const [latestNews, setLatestNews] = useState<FirebaseNews | null>(null);
  const [upcomingEvent, setUpcomingEvent] = useState<FirebaseEvent | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Fetch latest news
        const news = await fetchNews();
        if (news.length > 0) {
          setLatestNews(news[0]); // news is already sorted by date, newest first
        }

        // Fetch upcoming events
        const events = await fetchEvents();
        const now = new Date();
        const futureEvents = events.filter(event => new Date(event.date) > now);
        if (futureEvents.length > 0) {
          // Sort by date and get the closest upcoming event
          futureEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
          setUpcomingEvent(futureEvents[0]);
        }
      } catch (error) {
        console.error('Error loading home page data:', error);
      }
    };

    loadData();
  }, []);

  const scrollToContent = () => {
    window.scrollTo({
      top: window.innerHeight,
      behavior: 'smooth'
    });
  };

  const formatEventDate = (date: string) => {
    const eventDate = new Date(date);
    return `${eventDate.toLocaleDateString()} | ${eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="min-h-screen bg-[#003c71] text-white relative flex items-center justify-center pt-16">
        <div className="container mx-auto px-4 text-center py-12">
          <img 
            src={logo} 
            alt="Jesuit Dallas Real Estate Club" 
            className="h-64 w-auto mx-auto mb-1 animate-fade-in"
          />
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            Welcome to the Real Estate Club
          </h1>
          <p className="text-xl md:text-2xl mb-12 text-gray-300">
            Empowering future leaders in the world of real estate
          </p>
          <Button 
            size="lg" 
            className="bg-[#b3a369] hover:bg-[#a39359] text-white mb-12"
            asChild
          >
            <Link to="/membership">Join Us Today</Link>
          </Button>
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 cursor-pointer animate-bounce">
            <ArrowDown 
              className="w-8 h-8 text-white" 
              onClick={scrollToContent}
            />
            <span className="sr-only">Scroll down</span>
          </div>
        </div>
      </section>

      {/* What We Offer Section */}
      <section className="w-full py-12 bg-white">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="grid gap-6 md:grid-cols-3 w-full max-w-[1200px] mx-auto">
            <h2 className="text-3xl font-bold tracking-tighter text-[#003c71] text-center mb-6 animate-fade-in col-span-full">
              What We Offer
            </h2>
            {([
              { 
                title: "Upcoming Event", 
                content: upcomingEvent ? upcomingEvent.title : "No upcoming events", 
                date: upcomingEvent ? formatEventDate(upcomingEvent.date) : undefined, 
                description: upcomingEvent ? `${upcomingEvent.speaker} - ${upcomingEvent.speakerDescription}` : "Stay tuned for future events!", 
                link: upcomingEvent ? `/events/${upcomingEvent.id}` : "/events", 
                linkText: "Info", 
                icon: Calendar 
              },
              { 
                title: "Latest News", 
                content: latestNews ? latestNews.title : "No news available", 
                date: latestNews ? new Date(latestNews.createdAt).toLocaleDateString() : undefined, 
                description: latestNews ? truncateText(latestNews.content, 150) : "Check back soon for updates!", 
                link: latestNews ? `/news/${latestNews.id}` : "/news", 
                linkText: "Read Full Story", 
                icon: Newspaper 
              },
              { 
                title: "Membership", 
                content: "Join Our Community", 
                description: "Become a member of the Real Estate Club and gain access to exclusive events, networking opportunities, and hands-on experiences in the real estate industry.", 
                link: "/membership", 
                linkText: "Learn More", 
                icon: UserPlus 
              }
            ] as OfferCardProps[]).map((item, index) => (
              <Card key={index} className="flex flex-col transition-all duration-300 hover:shadow-lg animate-fade-in">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold text-[#003c71] flex items-center">
                    <item.icon className="mr-2 h-6 w-6" />
                    {item.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-grow">
                  <h3 className="text-xl font-semibold mb-2">{item.content}</h3>
                  {item.date && <p className="text-sm text-gray-600 mb-2">{item.date}</p>}
                  <p className="text-gray-600 mb-4">{item.description}</p>
                  <Button variant="outline" className="w-full hover:bg-[#003c71] hover:text-white transition-colors" asChild>
                    <Link to={item.link}>
                      {item.linkText}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Photo Gallery Section */}
      <section className="w-full py-12 bg-gray-50">
        <div className="container px-4 md:px-6 mx-auto">
          <h2 className="text-3xl font-bold tracking-tighter text-[#003c71] text-center mb-8 animate-fade-in">
            Photo Gallery
          </h2>
          <HomeCarousel />
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-[#003F87] text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-8">
            Ready to Start Your Real Estate Journey?
          </h2>
          <p className="mb-12 text-xl text-gray-300">
            Join the Real Estate Club today and take the first step towards a successful career in real estate.
          </p>
        </div>
      </section>
    </div>
  );
}