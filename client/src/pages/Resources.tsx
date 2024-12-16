import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface Resource {
  id: string;
  title: string;
  description: string;
  url: string;
  category: string;
}

const categories = [
  'Market Analysis',
  'Investment Strategies',
  'Property Management',
  'Legal Resources',
  'Educational Materials'
];

export function Resources() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [resources, setResources] = useState<Resource[]>([]);
  const [newResource, setNewResource] = useState<Omit<Resource, 'id'>>({
    title: '',
    description: '',
    url: '',
    category: categories[0]
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    const resourcesQuery = query(collection(db, 'resources'));
    const snapshot = await getDocs(resourcesQuery);
    const resourcesList = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Resource[];
    setResources(resourcesList);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'resources'), {
        ...newResource,
        createdAt: new Date(),
      });
      setNewResource({
        title: '',
        description: '',
        url: '',
        category: categories[0]
      });
      setIsDialogOpen(false);
      fetchResources();
      toast({
        title: "Success",
        description: "Resource created successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create resource",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (resourceId: string) => {
    try {
      await deleteDoc(doc(db, 'resources', resourceId));
      fetchResources();
      toast({
        title: "Success",
        description: "Resource deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete resource",
        variant: "destructive"
      });
    }
  };

  const filteredResources = selectedCategory
    ? resources.filter(r => r.category === selectedCategory)
    : resources;

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="flex justify-between items-center mb-12">
        <h1 className="text-4xl font-bold">Resources</h1>
        <div className="flex gap-4">
          <Select
            value={selectedCategory || ''}
            onValueChange={(value) => setSelectedCategory(value || null)}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {(user?.role === 'admin' || user?.role === 'editor') && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>Add Resource</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Resource</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <Input
                    placeholder="Resource Title"
                    value={newResource.title}
                    onChange={(e) => setNewResource({...newResource, title: e.target.value})}
                    required
                  />
                  <Textarea
                    placeholder="Resource Description"
                    value={newResource.description}
                    onChange={(e) => setNewResource({...newResource, description: e.target.value})}
                    required
                  />
                  <Input
                    type="url"
                    placeholder="Resource URL"
                    value={newResource.url}
                    onChange={(e) => setNewResource({...newResource, url: e.target.value})}
                    required
                  />
                  <Select
                    value={newResource.category}
                    onValueChange={(value) => setNewResource({...newResource, category: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button type="submit" className="w-full">Add Resource</Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredResources.map((resource) => (
          <Card key={resource.id}>
            <CardHeader>
              <CardTitle>{resource.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">{resource.description}</p>
              <div className="space-y-4">
                <div className="inline-block bg-primary/10 px-2 py-1 rounded">
                  {resource.category}
                </div>
                <div className="flex gap-4">
                  <Button asChild>
                    <a href={resource.url} target="_blank" rel="noopener noreferrer">
                      View Resource
                    </a>
                  </Button>
                  {(user?.role === 'admin' || user?.role === 'editor') && (
                    <Button
                      variant="destructive"
                      onClick={() => handleDelete(resource.id)}
                    >
                      Delete
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
