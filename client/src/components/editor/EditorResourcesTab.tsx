import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BookOpen } from 'lucide-react'
import { ResourceModal } from '../admin/ResourceModal'
import { useToast } from "@/hooks/use-toast"
import { useAuth } from '@/hooks/useAuth'
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

type Resource = {
  id: string;
  title: string;
  description: string;
  numberOfTexts: number;
  textFields: string[];
  userCreated: string;
  createdAt: any;
  updatedAt: any;
  updatedBy: string;
}

export function EditorResourcesTab() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [resources, setResources] = useState<Resource[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadResources = async () => {
    try {
      setIsLoading(true);
      setError(null); // Clear any previous errors
      const resourcesRef = collection(db, 'resources');
      const q = query(resourcesRef, where('userCreated', '==', user?.username));
      const snapshot = await getDocs(q);
      
      const userResources = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Resource[];

      setResources(userResources);
    } catch (error: any) {
      console.error('Error loading resources:', error);
      setError(error.message || "Failed to load resources");
      toast({
        title: "Error",
        description: error.message || "Failed to load resources",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadResources();
    }
  }, [user]);

  const handleDelete = async (id: string) => {
    try {
      // Find the resource and check if the user created it
      const resource = resources.find(r => r.id === id);
      if (!resource || resource.userCreated !== user?.username) {
        toast({
          title: "Access Denied",
          description: "You can only delete your own resources",
          variant: "destructive"
        });
        return;
      }

      // Confirm deletion
      if (!window.confirm('Are you sure you want to delete this resource? This action cannot be undone.')) {
        return;
      }

      const resourceRef = doc(db, 'resources', id);
      await deleteDoc(resourceRef);
      
      // Refresh the resources list
      await loadResources();

      toast({
        title: "Success",
        description: "Resource deleted successfully"
      });
    } catch (error: any) {
      console.error('Error deleting resource:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete resource",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6">
      <Card className="col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <BookOpen className="mr-2" />
              My Resources
            </div>
            <Button onClick={() => setIsModalOpen(true)}>
              Create Resource
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {isLoading ? (
              <Card className="p-4">
                <p className="text-gray-600">Loading resources...</p>
              </Card>
            ) : resources.length === 0 ? (
              <Card className="p-4">
                <p className="text-gray-600">No resources found</p>
              </Card>
            ) : resources.map((resource) => (
              <Card key={resource.id} className="p-4 relative">
                <h3 className="text-lg font-semibold text-[#003c71] mb-2">{resource.title}</h3>
                <p className="text-sm text-gray-600 mb-2">{resource.description}</p>
                <p className="text-sm text-gray-500 mb-2">Number of sections: {resource.numberOfTexts}</p>
                <div className="absolute bottom-4 right-4 space-x-2">
                  <Button variant="outline" size="sm" onClick={() => {
                    setEditingResource(resource);
                    setIsModalOpen(true);
                  }}>Edit</Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(resource.id)}>Delete</Button>
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <ResourceModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingResource(null);
        }}
        resource={editingResource}
        onSave={async (resourceData) => {
          // Refresh resources after save
          await loadResources();
          setIsModalOpen(false);
          setEditingResource(null);
        }}
      />
    </div>
  );
}
