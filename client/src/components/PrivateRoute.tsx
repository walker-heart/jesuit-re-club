import { Route, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PrivateRouteProps {
  path: string;
  component: React.ComponentType;
  roles?: string[];
}

export function PrivateRoute({ path, component: Component, roles }: PrivateRouteProps) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Card>
          <CardContent className="p-6">
            <p>Loading...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <Route path={path}>
      {() => {
        if (!user) {
          setLocation("/login");
          return null;
        }

        if (roles && (!user.role || !roles.includes(user.role))) {
          return (
            <div className="flex items-center justify-center min-h-[50vh]">
              <Card>
                <CardContent className="p-6">
                  <Alert variant="destructive">
                    <AlertDescription>You don't have permission to access this page</AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </div>
          );
        }

        return <Component />;
      }}
    </Route>
  );
}
