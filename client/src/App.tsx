import { Switch, Route } from "wouter";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Home } from "@/pages/Home";
import { Login } from "@/pages/Login";
import { About } from "@/pages/About";
import { Events } from "@/pages/Events";
import { Resources } from "@/pages/Resources";
import { News } from "@/pages/News";
import { Admin } from "@/pages/Admin";
import { useAuth } from "@/hooks/useAuth";

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/login" component={Login} />
          <Route path="/about" component={About} />
          <Route path="/events" component={Events} />
          <Route path="/resources" component={Resources} />
          <Route path="/news" component={News} />
          <Route path="/admin">
            {user?.role === 'admin' || user?.role === 'editor' ? (
              <Admin />
            ) : (
              <div>Unauthorized</div>
            )}
          </Route>
          <Route>
            <div className="container mx-auto px-4 py-16 text-center">
              <h1 className="text-4xl font-bold mb-4">404 - Page Not Found</h1>
              <p>The page you're looking for doesn't exist.</p>
            </div>
          </Route>
        </Switch>
      </main>
      <Footer />
    </div>
  );
}

export default App;
