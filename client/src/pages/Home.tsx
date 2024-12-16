import { Button } from "@/components/ui/button";
import { PhotoGallery } from "@/components/PhotoGallery";

export function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-primary text-primary-foreground py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Welcome to the Real Estate Club
          </h1>
          <p className="text-xl mb-8">
            Empowering future leaders in the world of real estate
          </p>
          <Button size="lg" asChild>
            <a href="/membership">Join Us Today</a>
          </Button>
        </div>
      </section>

      {/* What We Offer Section */}
      <section className="py-16 container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">What We Offer</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <h3 className="text-xl font-bold mb-4">Expert Speakers</h3>
            <p>Learn from industry professionals and gain valuable insights</p>
          </div>
          <div className="text-center">
            <h3 className="text-xl font-bold mb-4">Networking</h3>
            <p>Connect with peers and build relationships in the real estate world</p>
          </div>
          <div className="text-center">
            <h3 className="text-xl font-bold mb-4">Hands-on Experience</h3>
            <p>Participate in projects and case studies to apply your knowledge</p>
          </div>
        </div>
      </section>

      {/* Photo Gallery */}
      <section className="py-16 bg-muted">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Photo Gallery</h2>
          <PhotoGallery />
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 container mx-auto px-4 text-center">
        <h2 className="text-3xl font-bold mb-6">
          Ready to Start Your Real Estate Journey?
        </h2>
        <p className="mb-8 text-lg">
          Join the Real Estate Club today and take the first step towards a successful career in real estate.
        </p>
        <Button size="lg" asChild>
          <a href="/membership">Become a Member</a>
        </Button>
      </section>
    </div>
  );
}
