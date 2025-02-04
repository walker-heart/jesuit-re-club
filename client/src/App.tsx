import { Switch, Route } from "wouter";
import { Layout } from "@/components/Layout";
import { Home } from "@/pages/Home";
import { Login } from "@/pages/Login";
import { Account } from "@/pages/Account";
import { About } from "@/pages/About";
import { Events } from "@/pages/Events";
import { EventPage } from "@/pages/EventPage";
import { Resources } from "@/pages/Resources";
import { ResourcePage } from "@/pages/ResourcePage";
import { News } from "@/pages/News";
import { NewsPage } from "@/pages/NewsPage";
import { Admin } from "@/pages/Admin";
import { EditorDashboard } from "@/pages/EditorDashboard";
import { Membership } from "@/pages/Membership";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, AlertCircle } from "lucide-react";
import { Register } from '@/pages/Register';
import ModalShowcase from '@/pages/Modal';

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
      <Route path="/register">
        <Layout title="Register">
          <Register />
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
      <Route path="/news/:slug">
        <Layout>
          <NewsPage />
        </Layout>
      </Route>
      <Route path="/account">
        {user ? (
          <Layout title="Account">
            <Account />
          </Layout>
        ) : (
          <Layout title="Access Denied">
            <div className="container mx-auto px-4 py-16 text-center">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex mb-4 gap-2 justify-center">
                    <AlertCircle className="h-8 w-8 text-red-500" />
                    <h1 className="text-2xl font-bold">Access Denied</h1>
                  </div>
                  <p className="text-gray-600">Please login to view your account.</p>
                </CardContent>
              </Card>
            </div>
          </Layout>
        )}
      </Route>
      <Route path="/admin">
        <Layout title="Admin Dashboard">
          {user?.role === 'admin' ? (
            <Admin />
          ) : (
            <div className="container mx-auto px-4 py-16 text-center">
              <h1 className="text-4xl font-bold mb-4 text-red-500">Access Denied</h1>
              <p>You don't have permission to access this page.</p>
            </div>
          )}
        </Layout>
      </Route>
      <Route path="/editor">
        <Layout title="Editor Dashboard">
          <EditorDashboard />
        </Layout>
      </Route>
      <Route path="/modal">
        <Layout title="Modal Showcase">
          <ModalShowcase />
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
