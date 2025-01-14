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
        setIsVisible(currentScrollY > 50);
      } else {
        setIsVisible(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [location]);

  const headerClasses = `fixed top-0 left-0 right-0 z-50 bg-[#ffffff] text-[#003c71] transition-transform duration-500 ease-in-out ${
    isVisible ? "translate-y-0 opacity-100 shadow-lg backdrop-blur-sm bg-opacity-95" : "-translate-y-full opacity-0"
  } ${location === "/" ? "transition-all duration-500" : ""}`;

  return (
    <header className={headerClasses}>
      <nav className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="text-2xl font-bold">
          <Link href="/">Real Estate Club</Link>
        </div>

        <div className="flex gap-6 items-center">
          <Link href="/">
            <span className="nav-link-hover">Home</span>
          </Link>
          <Link href="/about">
            <span className="nav-link-hover">About Us</span>
          </Link>
          <Link href="/events">
            <span className="nav-link-hover">Events</span>
          </Link>
          <Link href="/membership">
            <span className="nav-link-hover">Membership</span>
          </Link>
          <Link href="/resources">
            <span className="nav-link-hover">Resources</span>
          </Link>
          <Link href="/news">
            <span className="nav-link-hover">News</span>
          </Link>

          {user?.role === 'admin' && (
            <Link href="/admin">
              <Button variant="secondary" className="bg-[#b3a369] hover:bg-[#a39359] text-[#003c71] button-hover">
                Admin
              </Button>
            </Link>
          )}
          {user?.role === 'editor' && (
            <Link href="/editor">
              <Button variant="secondary" className="bg-[#b3a369] hover:bg-[#a39359] text-[#003c71] button-hover">
                Editor
              </Button>
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}