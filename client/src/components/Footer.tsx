import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { fetchEvents } from "@/lib/firebase/events";
import type { FirebaseEvent } from "@/lib/firebase/types";
import { fetchInfo } from "@/lib/firebase/info";
import type { FirebaseInfo } from "@/lib/firebase/types";

export function Footer() {
  const { user } = useAuth();
  const [nextEvent, setNextEvent] = useState<FirebaseEvent | null>(null);
  const [aboutSections, setAboutSections] = useState<FirebaseInfo[]>([]);

  useEffect(() => {
    const loadNextEvent = async () => {
      try {
        const events = await fetchEvents();
        const now = new Date();
        const futureEvents = events.filter(event => new Date(event.date) > now);
        if (futureEvents.length > 0) {
          // Sort by date and get the closest upcoming event
          futureEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
          setNextEvent(futureEvents[0]);
        }
      } catch (error) {
        console.error('Error loading next event:', error);
      }
    };

    loadNextEvent();
  }, []);

  useEffect(() => {
    const loadAboutInfo = async () => {
      try {
        const info = await fetchInfo('aboutus');
        setAboutSections(info);
      } catch (error) {
        console.error('Error loading about info:', error);
      }
    };

    loadAboutInfo();
  }, []);

  return (
    <footer className="bg-[#003c71] text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-[#b3a369]">ABOUT US</h3>
            <ul className="space-y-2">
              {aboutSections.map((section, index) => (
                <li key={section.id}>
                  <Link href={`/about#${index + 1}`}>
                    <a className="text-gray-300 hover:text-[#b3a369] transition-colors">
                      {section.title}
                    </a>
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/about">
                  <a className="text-gray-300 hover:text-[#b3a369] transition-colors">
                    About Us
                  </a>
                </Link>
              </li>
            </ul>
          </div>
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-[#b3a369]">EVENTS</h3>
            <ul className="space-y-2">
              <li><Link href="/events#upcoming" className="text-gray-300 hover:text-[#b3a369]">Upcoming Events</Link></li>
              <li><Link href="/events#past" className="text-gray-300 hover:text-[#b3a369]">Past Events</Link></li>
              {nextEvent ? (
                <li>
                  <Link 
                    href={`/events/${nextEvent.id}`} 
                    className="text-gray-300 hover:text-[#b3a369]"
                  >
                    Next Speaker: {nextEvent.speaker}
                  </Link>
                </li>
              ) : (
                <li>
                  <Link 
                    href="/events#upcoming" 
                    className="text-gray-300 hover:text-[#b3a369]"
                  >
                    Next Speaker: TBA
                  </Link>
                </li>
              )}
              <li>
                <a 
                  href="https://forms.gle/tfB5SnqqQHQbP31A9" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-gray-300 hover:text-[#b3a369]"
                >
                  Request a Speaker
                </a>
              </li>
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
        </div>
      </div>
    </footer>
  );
}