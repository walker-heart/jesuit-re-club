import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";

export function Footer() {
  const { user } = useAuth();
  return (
    <footer className="bg-[#003c71] text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-[#b3a369]">ABOUT US</h3>
            <ul className="space-y-2">
              <li><Link href="/about#story" className="text-gray-300 hover:text-[#b3a369]">Our Story</Link></li>
              <li><Link href="/about#mission" className="text-gray-300 hover:text-[#b3a369]">Mission & Values</Link></li>
              <li><Link href="/about#leadership" className="text-gray-300 hover:text-[#b3a369]">Leadership Team</Link></li>
              <li><Link href="/contact" className="text-gray-300 hover:text-[#b3a369]">Contact Us</Link></li>
            </ul>
          </div>
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-[#b3a369]">EVENTS</h3>
            <ul className="space-y-2">
              <li><Link href="/events#upcoming" className="text-gray-300 hover:text-[#b3a369]">Upcoming Events</Link></li>
              <li><Link href="/events#past" className="text-gray-300 hover:text-[#b3a369]">Past Events</Link></li>
              <li><Link href="/events#workshops" className="text-gray-300 hover:text-[#b3a369]">Workshops</Link></li>
              <li><Link href="/events#speaker-series" className="text-gray-300 hover:text-[#b3a369]">Speaker Series</Link></li>
            </ul>
          </div>
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-[#b3a369]">RESOURCES</h3>
            <ul className="space-y-2">
              <li><Link href="/resources#learning" className="text-gray-300 hover:text-[#b3a369]">Learning Materials</Link></li>
              <li><Link href="/resources#news" className="text-gray-300 hover:text-[#b3a369]">Industry News</Link></li>
              <li><Link href="/resources#analysis" className="text-gray-300 hover:text-[#b3a369]">Market Analysis</Link></li>
              <li><Link href="/resources#career" className="text-gray-300 hover:text-[#b3a369]">Career Guide</Link></li>
            </ul>
          </div>
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-[#b3a369]">MEMBERSHIP</h3>
            <ul className="space-y-2">
              <li><Link href="/membership#join" className="text-gray-300 hover:text-[#b3a369]">Join Us</Link></li>
              <li><Link href="/membership#benefits" className="text-gray-300 hover:text-[#b3a369]">Benefits</Link></li>
              <li><Link href="/membership#directory" className="text-gray-300 hover:text-[#b3a369]">Member Directory</Link></li>
              <li><Link href="/membership#faq" className="text-gray-300 hover:text-[#b3a369]">FAQ</Link></li>
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
                <a href={user ? "/account" : "/login"} className="hover:text-[#b3a369]">
                  {user ? "Account" : "Login"}
                </a>
                <Link href="/privacy" className="hover:text-[#b3a369]">Privacy Policy</Link>
                <Link href="/terms" className="hover:text-[#b3a369]">Terms of Service</Link>
              </div>
            </div>
          </div>
          <div className="flex justify-center space-x-6 mt-8">
            <a href="https://www.facebook.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#b3a369]">FB</a>
            <a href="https://www.twitter.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#b3a369]">TW</a>
            <a href="https://www.instagram.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#b3a369]">IG</a>
            <a href="https://www.linkedin.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#b3a369]">LI</a>
          </div>
        </div>
      </div>
    </footer>
  );
}