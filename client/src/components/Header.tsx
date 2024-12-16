import { Link } from "wouter";

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm">
      <nav className="container mx-auto">
        <div className="flex items-center justify-between h-16">
          <Link href="/">
            <div className="text-lg font-bold text-[#003c71] hover:text-[#003c71]/90 transition-colors duration-200 cursor-pointer">
              Real Estate Club
            </div>
          </Link>
          
          <div className="flex items-center space-x-8">
            <Link href="/">
              <div className="text-[#003c71] hover:text-[#b3a369] transition-colors duration-200 cursor-pointer">Home</div>
            </Link>
            <Link href="/about">
              <div className="text-[#003c71] hover:text-[#b3a369] transition-colors duration-200 cursor-pointer">About Us</div>
            </Link>
            <Link href="/events">
              <div className="text-[#003c71] hover:text-[#b3a369] transition-colors duration-200 cursor-pointer">Events</div>
            </Link>
            <Link href="/membership">
              <div className="text-[#003c71] hover:text-[#b3a369] transition-colors duration-200 cursor-pointer">Membership</div>
            </Link>
            <Link href="/resources">
              <div className="text-[#003c71] hover:text-[#b3a369] transition-colors duration-200 cursor-pointer">Resources</div>
            </Link>
            <Link href="/news">
              <div className="text-[#003c71] hover:text-[#b3a369] transition-colors duration-200 cursor-pointer">News</div>
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
}
