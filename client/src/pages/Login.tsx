import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { login } = useAuth();

  const { isAuthenticated } = useAuth();
  
  // Check if user is already logged in
  useEffect(() => {
    if (isAuthenticated) {
      setLocation('/');
    }
  }, [isAuthenticated, setLocation]);

  const validateForm = (): boolean => {
    if (!email) {
      setError('Email is required');
      return false;
    }
    if (!password) {
      setError('Password is required');
      return false;
    }
    if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email)) {
      setError('Invalid email address');
      return false;
    }
    return true;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await login({ email, password });
      toast({
        title: "Success",
        description: "Logged in successfully",
      });
      setLocation('/');
    } catch (error: any) {
      console.error('Login error:', error);
      setError(error.message);
      toast({
        title: "Login Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <h1 className="text-2xl font-bold text-center">Login</h1>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError(null);
                }}
                required
                className={error ? 'border-red-500' : ''}
                disabled={isSubmitting}
                autoComplete="email"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                }}
                required
                className={error ? 'border-red-500' : ''}
                disabled={isSubmitting}
                autoComplete="current-password"
                minLength={6}
              />
            </div>
            <Button 
              type="submit" 
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Signing in...' : 'Sign in'}
            </Button>
            <div className="text-center text-sm">
              <span className="text-muted-foreground">Don't have an account? </span>
              <Button
                variant="link"
                className="p-0 h-auto font-normal"
                onClick={() => setLocation('/register')}
              >
                Create one
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
