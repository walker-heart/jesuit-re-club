import { useAuth } from "@/hooks/useAuth";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export function Footer() {
  const { user } = useAuth();

  return (
    <footer className="bg-[#003F87] text-white mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-bold mb-4">Real Estate Club</h3>
            <p className="text-sm">12345 Inwood Road<br />Dallas, TX 75244</p>
          </div>
          
          <div>
            <h3 className="font-bold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/about"><a className="hover:text-gray-200">About Us</a></Link></li>
              <li><Link href="/events"><a className="hover:text-gray-200">Events</a></Link></li>
              <li><Link href="/resources"><a className="hover:text-gray-200">Resources</a></Link></li>
              <li><Link href="/news"><a className="hover:text-gray-200">News</a></Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-bold mb-4">Contact</h3>
            <ul className="space-y-2 text-sm">
              <li>Email: realestateclub@jesuitcp.org</li>
              <li>Phone: (972) 387-8700</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-bold mb-4">Follow Us</h3>
            <div className="flex space-x-4">
              <a href="https://www.linkedin.com/school/jesuit-dallas/" target="_blank" rel="noopener noreferrer" className="hover:text-gray-200">LinkedIn</a>
              <a href="https://twitter.com/jesuitdallas" target="_blank" rel="noopener noreferrer" className="hover:text-gray-200">Twitter</a>
              <a href="https://www.instagram.com/jesuitdallas/" target="_blank" rel="noopener noreferrer" className="hover:text-gray-200">Instagram</a>
            </div>
          </div>
        </div>
        
        <div className="border-t border-white/10 mt-8 pt-8 flex justify-between items-center text-sm">
          <p>&copy; {new Date().getFullYear()} Real Estate Club at Jesuit Dallas. All rights reserved.</p>
          {user ? (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => auth.signOut()}
              className="text-white hover:text-gray-200"
            >
              Logout
            </Button>
          ) : (
            <Link href="/login">
              <Button 
                variant="ghost" 
                size="sm"
                className="text-white hover:text-gray-200"
              >
                Login
              </Button>
            </Link>
          )}
        </div>
      </div>
    </footer>
  );
}
