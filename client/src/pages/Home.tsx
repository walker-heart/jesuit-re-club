import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PhotoGallery } from "@/components/PhotoGallery";
import { ArrowDown, ArrowRight, Calendar, Newspaper, UserPlus } from "lucide-react";
import { Link } from "wouter";

export function Home() {
  const scrollToContent = () => {
    window.scrollTo({
      top: window.innerHeight,
      behavior: 'smooth'
    });
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="h-screen bg-[#003c71] text-white relative flex items-center justify-center">
        <div className="container mx-auto px-4 text-center">
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
            <a href="/membership">Join Us Today</a>
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
      <section className="w-full py-24 lg:py-32 bg-gray-50">
        <div className="container px-4 md:px-6">
          <h2 className="text-3xl font-bold tracking-tighter text-[#003c71] text-center mb-12 animate-fade-in">
            What We Offer
          </h2>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 items-stretch max-w-[1000px] mx-auto">
            {[
              { title: "Upcoming Event", content: "Guest Speaker: John Doe", date: "May 15, 2024 | 4:00 PM", description: "Join us for an insightful talk on commercial real estate trends with industry expert John Doe.", link: "/events/1", linkText: "Info", icon: Calendar },
              { title: "Latest News", content: "Club Wins National Competition", date: "April 30, 2024", description: "Our Real Estate Club team took first place in the National Real Estate Challenge. Congratulations to all participants!", link: "/news", linkText: "Read Full Story", icon: Newspaper },
              { title: "Membership", content: "Join Our Community", description: "Become a member of the Real Estate Club and gain access to exclusive events, networking opportunities, and hands-on experiences in the real estate industry.", link: "/membership", linkText: "Learn More", icon: UserPlus }
            ].map((item, index) => (
              <Card key={index} className="flex flex-col transition-all duration-300 hover:shadow-lg animate-fade-in card-hover" style={{animationDelay: `${index * 100}ms`}}>
                <CardHeader>
                  <CardTitle className="text-2xl font-bold text-[#003c71] flex items-center">
                    {item.icon && <item.icon className="mr-2 h-6 w-6" />}
                    {item.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-grow">
                  <h3 className="text-xl font-semibold mb-2">{item.content}</h3>
                  {item.date && <p className="text-sm text-gray-600 mb-2">{item.date}</p>}
                  <p className="text-gray-600 mb-4">{item.description}</p>
                  <Button asChild variant="outline" className="w-full hover:bg-[#003c71] hover:text-white transition-colors button-hover">
                    <Link href={item.link}>
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
      <section className="w-full py-24 lg:py-32 bg-gray-50">
        <div className="container px-4 md:px-6">
          <h2 className="text-3xl font-bold tracking-tighter text-[#003c71] text-center mb-12 animate-fade-in">
            Photo Gallery
          </h2>
          <PhotoGallery />
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
          <Button 
            size="lg" 
            className="bg-[#C4B47F] hover:bg-[#B3A26E] text-white"
            asChild
          >
            <a href="/membership">Become a Member</a>
          </Button>
        </div>
      </section>
    </div>
  );
}
