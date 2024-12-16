import { useAuth } from "@/hooks/useAuth";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export function Footer() {
  const { user } = useAuth();

  return (
    <footer className="bg-[#003c71] text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-[#b3a369]">ABOUT US</h3>
            <ul className="space-y-2">
              <li><Link href="/about#story"><a className="text-gray-300 hover:text-[#b3a369]">Our Story</a></Link></li>
              <li><Link href="/about#mission"><a className="text-gray-300 hover:text-[#b3a369]">Mission & Values</a></Link></li>
              <li><Link href="/about#leadership"><a className="text-gray-300 hover:text-[#b3a369]">Leadership Team</a></Link></li>
              <li><Link href="/contact"><a className="text-gray-300 hover:text-[#b3a369]">Contact Us</a></Link></li>
            </ul>
          </div>
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-[#b3a369]">EVENTS</h3>
            <ul className="space-y-2">
              <li><Link href="/events#upcoming"><a className="text-gray-300 hover:text-[#b3a369]">Upcoming Events</a></Link></li>
              <li><Link href="/events#past"><a className="text-gray-300 hover:text-[#b3a369]">Past Events</a></Link></li>
              <li><Link href="/events#workshops"><a className="text-gray-300 hover:text-[#b3a369]">Workshops</a></Link></li>
              <li><Link href="/events#speaker-series"><a className="text-gray-300 hover:text-[#b3a369]">Speaker Series</a></Link></li>
            </ul>
          </div>
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-[#b3a369]">RESOURCES</h3>
            <ul className="space-y-2">
              <li><Link href="/resources#learning"><a className="text-gray-300 hover:text-[#b3a369]">Learning Materials</a></Link></li>
              <li><Link href="/resources#news"><a className="text-gray-300 hover:text-[#b3a369]">Industry News</a></Link></li>
              <li><Link href="/resources#analysis"><a className="text-gray-300 hover:text-[#b3a369]">Market Analysis</a></Link></li>
              <li><Link href="/resources#career"><a className="text-gray-300 hover:text-[#b3a369]">Career Guide</a></Link></li>
            </ul>
          </div>
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-[#b3a369]">MEMBERSHIP</h3>
            <ul className="space-y-2">
              <li><Link href="/membership#join"><a className="text-gray-300 hover:text-[#b3a369]">Join Us</a></Link></li>
              <li><Link href="/membership#benefits"><a className="text-gray-300 hover:text-[#b3a369]">Benefits</a></Link></li>
              <li><Link href="/membership#directory"><a className="text-gray-300 hover:text-[#b3a369]">Member Directory</a></Link></li>
              <li><Link href="/membership#faq"><a className="text-gray-300 hover:text-[#b3a369]">FAQ</a></Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="text-sm text-gray-400">
              <p>Jesuit College Preparatory School of Dallas</p>
              <p>12345 Inwood Rd, Dallas, TX 75244</p>
            </div>
            <div className="text-sm text-gray-400 md:text-right space-y-1">
              <p>&copy; {new Date().getFullYear()} Real Estate Club at Jesuit Dallas</p>
              <div className="space-x-4">
                {user ? (
                  <Button 
                    variant="ghost"
                    size="sm"
                    onClick={() => auth.signOut()}
                    className="hover:text-[#b3a369]"
                  >
                    Logout
                  </Button>
                ) : (
                  <Link href="/login">
                    <a className="hover:text-[#b3a369]">Login</a>
                  </Link>
                )}
                <Link href="/privacy"><a className="hover:text-[#b3a369]">Privacy Policy</a></Link>
                <Link href="/terms"><a className="hover:text-[#b3a369]">Terms of Service</a></Link>
              </div>
            </div>
          </div>
          <div className="flex justify-center space-x-6 mt-8">
            <a href="https://www.facebook.com/jesuitdallas" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#b3a369]">FB</a>
            <a href="https://twitter.com/jesuitdallas" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#b3a369]">TW</a>
            <a href="https://www.instagram.com/jesuitdallas" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#b3a369]">IG</a>
            <a href="https://www.linkedin.com/school/jesuit-dallas" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#b3a369]">LI</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
