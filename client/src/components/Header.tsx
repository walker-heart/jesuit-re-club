import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { auth } from "@/lib/firebase";

export function Header() {
  const { user } = useAuth();

  return (
    <header className="bg-primary text-primary-foreground">
      <nav className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/">
          <a className="text-2xl font-bold">Real Estate Club</a>
        </Link>

        <div className="flex gap-6 items-center">
          <Link href="/about"><a className="hover:text-white">About</a></Link>
          <Link href="/events"><a className="hover:text-white">Events</a></Link>
          <Link href="/resources"><a className="hover:text-white">Resources</a></Link>
          <Link href="/news"><a className="hover:text-white">News</a></Link>
          
          {user ? (
            <>
              {(user.role === 'admin' || user.role === 'editor') && (
                <Link href="/admin">
                  <Button variant="secondary">Admin</Button>
                </Link>
              )}
              <Button 
                variant="secondary"
                onClick={() => auth.signOut()}
              >
                Logout
              </Button>
            </>
          ) : (
            <Link href="/login">
              <Button variant="secondary">Login</Button>
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
