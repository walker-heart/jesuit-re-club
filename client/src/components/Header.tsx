import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { auth } from "@/lib/firebase";
import { useState, useEffect } from "react";

export function Header() {
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(true);
  const [location] = useLocation();
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const isHome = location === "/";
      const currentScrollY = window.scrollY;
      
      if (isHome) {
        // On home page, show header only after scrolling past hero section
        setIsVisible(currentScrollY > window.innerHeight * 0.5);
      } else {
        // On other pages, always show header
        setIsVisible(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Initial check

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [location]);

  const headerClasses = `fixed top-0 left-0 right-0 z-50 bg-[#003c71] text-white transition-transform duration-500 ease-in-out ${
    isVisible ? "translate-y-0 opacity-100 shadow-lg backdrop-blur-sm bg-opacity-95" : "-translate-y-full opacity-0"
  } ${location === "/" ? "transition-all duration-500" : ""}`;

  return (
    <header className={headerClasses}>
      <nav className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/">
          <a className="text-2xl font-bold">Real Estate Club</a>
        </Link>

        <div className="flex gap-6 items-center">
          <Link href="/"><a className="hover:text-gray-200">Home</a></Link>
          <Link href="/about"><a className="hover:text-gray-200">About Us</a></Link>
          <Link href="/events"><a className="hover:text-gray-200">Events</a></Link>
          <Link href="/membership"><a className="hover:text-gray-200">Membership</a></Link>
          <Link href="/resources"><a className="hover:text-gray-200">Resources</a></Link>
          <Link href="/news"><a className="hover:text-gray-200">News</a></Link>
          
          {(user?.role === 'admin' || user?.role === 'editor') && (
            <Link href="/admin">
              <Button variant="secondary" className="bg-[#b3a369] hover:bg-[#a39359] text-white">Admin</Button>
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
