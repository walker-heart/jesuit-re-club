import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export function Membership() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    grade: '',
    interests: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // TODO: Implement form submission
      toast({
        title: "Success",
        description: "Your membership application has been submitted.",
      });
      setFormData({
        name: '',
        email: '',
        grade: '',
        interests: ''
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit application",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold text-center mb-12">Join the Real Estate Club</h1>
      
      <div className="grid md:grid-cols-2 gap-12">
        <div>
          <h2 className="text-2xl font-bold mb-6">Member Benefits</h2>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Networking Opportunities</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Connect with industry professionals, alumni, and fellow students interested in real estate.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Educational Resources</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Access exclusive resources, market analyses, and educational materials.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Event Access</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Priority access to club events, speaker series, and workshops.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Hands-on Experience</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Participate in real estate projects and case studies.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        <div>
          <Card className="p-6">
            <CardHeader>
              <CardTitle>Membership Application</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Full Name</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Grade Level</label>
                  <Input
                    value={formData.grade}
                    onChange={(e) => setFormData({...formData, grade: e.target.value})}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Why are you interested in joining the Real Estate Club?
                  </label>
                  <Textarea
                    value={formData.interests}
                    onChange={(e) => setFormData({...formData, interests: e.target.value})}
                    className="min-h-[100px]"
                    required
                  />
                </div>

                <Button type="submit" className="w-full bg-[#003c71] hover:bg-[#002c61] text-white">
                  Submit Application
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
