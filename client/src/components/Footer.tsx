export function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-bold mb-4">Real Estate Club</h3>
            <p className="text-sm">Empowering future leaders in the world of real estate</p>
          </div>
          
          <div>
            <h3 className="font-bold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="/about" className="hover:text-white">About Us</a></li>
              <li><a href="/events" className="hover:text-white">Events</a></li>
              <li><a href="/resources" className="hover:text-white">Resources</a></li>
              <li><a href="/news" className="hover:text-white">News</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-bold mb-4">Contact</h3>
            <ul className="space-y-2 text-sm">
              <li>Email: info@realestateclub.com</li>
              <li>Phone: (555) 123-4567</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-bold mb-4">Follow Us</h3>
            <div className="flex space-x-4">
              <a href="#" className="hover:text-white">LinkedIn</a>
              <a href="#" className="hover:text-white">Twitter</a>
              <a href="#" className="hover:text-white">Instagram</a>
            </div>
          </div>
        </div>
        
        <div className="border-t border-primary-foreground/10 mt-8 pt-8 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} Real Estate Club. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
