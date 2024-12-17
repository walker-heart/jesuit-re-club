import { ReactNode } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

interface PrivateRouteProps {
  children: ReactNode;
  allowedRoles?: string[];
}

export function PrivateRoute({ children, allowedRoles }: PrivateRouteProps) {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

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

  if (!user) {
    setLocation('/login');
    return null;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-6">
            <Alert variant="destructive">
              <AlertDescription>You don't have permission to access this page.</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
