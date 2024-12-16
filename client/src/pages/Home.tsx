import { Button } from "@/components/ui/button";
import { PhotoGallery } from "@/components/PhotoGallery";
import { ArrowDown } from "lucide-react";

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
      <section className="h-screen bg-[#003F87] text-white relative flex items-center justify-center">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            Welcome to the Real Estate Club
          </h1>
          <p className="text-xl md:text-2xl mb-12 text-gray-300">
            Empowering future leaders in the world of real estate
          </p>
          <Button 
            size="lg" 
            className="bg-[#C4B47F] hover:bg-[#B3A26E] text-white mb-12"
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
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-16">What We Offer</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center">
              <h3 className="text-2xl font-bold mb-4">Expert Speakers</h3>
              <p className="text-gray-600">
                Learn from industry professionals and gain valuable insights
              </p>
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-bold mb-4">Networking</h3>
              <p className="text-gray-600">
                Connect with peers and build relationships in the real estate world
              </p>
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-bold mb-4">Hands-on Experience</h3>
              <p className="text-gray-600">
                Participate in projects and case studies to apply your knowledge
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Photo Gallery */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-16">Photo Gallery</h2>
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
