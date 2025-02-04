import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { auth } from "@/lib/firebase";
import { useState, useEffect } from "react";

// Import logo
import logo from "@/assets/images/RealEstate-hor-2col.png";

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
        // Show header after minimal scroll
        setIsVisible(currentScrollY > 50);
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

  const headerClasses = `fixed top-0 left-0 right-0 z-50 bg-[#ffffff] text-[#003c71] transition-transform duration-500 ease-in-out ${
    isVisible ? "translate-y-0 opacity-100 shadow-lg backdrop-blur-sm bg-opacity-95" : "-translate-y-full opacity-0"
  } ${location === "/" ? "transition-all duration-500" : ""}`;

  return (
    <header className={headerClasses}>
      <nav className="container mx-auto px-8 h-[72px] flex items-center justify-between max-w-[1400px]">
        <Link href="/">
          <a className="flex items-center -ml-4">
            <img 
              src={logo} 
              alt="Jesuit Dallas Real Estate Club" 
              className="h-16 w-auto -my-6"
            />
          </a>
        </Link>

        <div className="flex gap-8 items-center">
          <Link href="/" className="nav-link-hover">Home</Link>
          <Link href="/about" className="nav-link-hover">About Us</Link>
          <Link href="/events" className="nav-link-hover">Events</Link>
          <Link href="/membership" className="nav-link-hover">Membership</Link>
          <Link href="/resources" className="nav-link-hover">Resources</Link>
          <Link href="/news" className="nav-link-hover">News</Link>
          
          {user?.role === 'admin' && (
            <Link href="/admin">
              <Button variant="secondary" className="bg-[#b3a369] hover:bg-[#a39359] text-[#003c71] button-hover ml-4">
                Admin
              </Button>
            </Link>
          )}
          {user?.role === 'editor' && (
            <Link href="/editor">
              <Button variant="secondary" className="bg-[#b3a369] hover:bg-[#a39359] text-[#003c71] button-hover ml-4">
                Editor
              </Button>
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
