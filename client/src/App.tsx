import { Switch, Route } from "wouter";
import { Layout } from "@/components/Layout";
import { Home } from "@/pages/Home";
import { Login } from "@/pages/Login";
import { About } from "@/pages/About";
import { Events } from "@/pages/Events";
import { EventPage } from "@/pages/EventPage";
import { Resources } from "@/pages/Resources";
import { ResourcePage } from "@/pages/ResourcePage";
import { News } from "@/pages/News";
import { Admin } from "@/pages/Admin";
import { Membership } from "@/pages/Membership";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card>
          <CardContent className="py-6">
            <div className="flex items-center space-x-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <p>Loading...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/">
        <Layout>
          <Home />
        </Layout>
      </Route>
      <Route path="/login">
        <Layout title="Login">
          <Login />
        </Layout>
      </Route>
      <Route path="/about">
        <Layout title="About Us">
          <About />
        </Layout>
      </Route>
      <Route path="/events">
        <Layout title="Events">
          <Events />
        </Layout>
      </Route>
      <Route path="/events/:slug">
        <Layout>
          <EventPage />
        </Layout>
      </Route>
      <Route path="/membership">
        <Layout title="Membership">
          <Membership />
        </Layout>
      </Route>
      <Route path="/resources">
        <Layout title="Resources">
          <Resources />
        </Layout>
      </Route>
      <Route path="/resources/:slug">
        <Layout>
          <ResourcePage />
        </Layout>
      </Route>
      <Route path="/news">
        <Layout title="News">
          <News />
        </Layout>
      </Route>
      <Route path="/admin">
        <Layout title="Admin Dashboard">
          {user?.role === 'admin' || user?.role === 'editor' ? (
            <Admin />
          ) : (
            <div className="container mx-auto px-4 py-16 text-center">
              <h1 className="text-4xl font-bold mb-4 text-red-500">Access Denied</h1>
              <p>You don't have permission to access this page.</p>
            </div>
          )}
        </Layout>
      </Route>
      <Route>
        <Layout title="Page Not Found">
          <div className="container mx-auto px-4 py-16 text-center">
            <h1 className="text-4xl font-bold mb-4">404 - Page Not Found</h1>
            <p>The page you're looking for doesn't exist.</p>
          </div>
        </Layout>
      </Route>
    </Switch>
  );
}

export default App;
