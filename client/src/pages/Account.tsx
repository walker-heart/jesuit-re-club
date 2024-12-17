import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogOut, User, Shield } from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";

export function Account() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await logout();
      setLocation('/');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Authentication check is now handled by the router in App.tsx
  if (!user) return null;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Profile Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-6 w-6 text-[#003c71]" />
              Profile Information
            </CardTitle>
            <CardDescription>Your account details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">First Name</h3>
                <p className="mt-1 text-lg">{user.displayName?.split(' ')[0] || 'Walker'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Last Name</h3>
                <p className="mt-1 text-lg">{user.displayName?.split(' ')[1] || 'Heartfield'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Username</h3>
                <p className="mt-1 text-lg">{user.username || 'walkerheart'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Email</h3>
                <p className="mt-1 text-lg">{user.email || 'wheartfield@gmail.com'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Role</h3>
                <p className="mt-1 text-lg capitalize flex items-center gap-2">
                  <Shield className="h-4 w-4 text-[#003c71]" />
                  {user.role || 'Admin'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Role-specific Dashboard Access */}
        {(user.role === 'admin' || user.role === 'editor') && (
          <Card>
            <CardHeader>
              <CardTitle>Dashboard Access</CardTitle>
              <CardDescription>Quick access to your dashboard</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                variant="outline"
                className="w-full bg-[#003c71] text-white hover:bg-[#002c51]"
                onClick={() => setLocation(user.role === 'admin' ? '/admin' : '/editor')}
              >
                Go to {user.role.charAt(0).toUpperCase() + user.role.slice(1)} Dashboard
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Logout Section */}
        <Card>
          <CardHeader>
            <CardTitle>Account Actions</CardTitle>
            <CardDescription>Manage your account</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              variant="destructive"
              className="w-full"
              onClick={handleLogout}
              disabled={isLoading}
            >
              {isLoading ? (
                "Logging out..."
              ) : (
                <>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
