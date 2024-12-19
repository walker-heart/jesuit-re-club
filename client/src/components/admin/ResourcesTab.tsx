import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BookOpen } from 'lucide-react'
import { ResourceModal } from './ResourceModal'
import { useToast } from "@/hooks/use-toast"
import { useAuth } from '@/hooks/useAuth'
import { auth } from '@/lib/firebase/firebase-config'
import { fetchResources, deleteResource, createResource, updateResource } from '@/lib/firebase/resources'
import type { FirebaseResource } from '@/lib/firebase/types'

export function ResourcesTab() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [resources, setResources] = useState<FirebaseResource[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<FirebaseResource | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadResources = async () => {
    try {
      setIsLoading(true);
      setError(null); // Clear any previous errors
      
      const fetchedResources = await fetchResources();
      console.log('Fetched resources:', fetchedResources);
      setResources(fetchedResources);
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
    if (auth.currentUser) {
      loadResources();
    }
  }, [auth.currentUser]);

  const handleDelete = async (id: string) => {
    try {
      if (!id || !auth.currentUser) return;

      // Confirm deletion
      if (!window.confirm('Are you sure you want to delete this resource? This action cannot be undone.')) {
        return;
      }

      await deleteResource(id);
      await loadResources(); // Refresh the list after deletion

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
              Resources
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
            ) : error ? (
              <Card className="p-4">
                <p className="text-red-600">Error: {error}</p>
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
                <p className="text-sm text-gray-500 mb-2">Created by: {resource.userCreated}</p>
                <p className="text-sm text-gray-500 mb-2">Created at: {new Date(resource.createdAt).toLocaleString()}</p>
                {resource.updatedAt && (
                  <p className="text-sm text-gray-500 mb-2">Last updated: {new Date(resource.updatedAt).toLocaleString()} by {resource.updatedBy}</p>
                )}
                <div className="absolute bottom-4 right-4 space-x-2">
                  {user && (user.role === 'admin' || resource.userCreated === auth.currentUser?.email) && (
                    <>
                      <Button variant="outline" size="sm" onClick={() => {
                        setEditingResource(resource);
                        setIsModalOpen(true);
                      }}>Edit</Button>
                      <Button variant="destructive" size="sm" onClick={() => resource.id && handleDelete(resource.id)}>Delete</Button>
                    </>
                  )}
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
          try {
            if (!auth.currentUser) {
              throw new Error('You must be logged in to save resources');
            }

            console.log('Saving resource:', resourceData);

            if (editingResource) {
              // Handle resource update
              if (!resourceData || typeof resourceData !== 'object') {
                throw new Error('Invalid resource data');
              }

              const updatePayload: FirebaseResource = {
                ...editingResource,
                title: (resourceData as FirebaseResource).title || '',
                description: (resourceData as FirebaseResource).description || '',
                numberOfTexts: (resourceData as FirebaseResource).numberOfTexts || 0,
                textFields: (resourceData as FirebaseResource).textFields || [],
                updatedAt: new Date().toISOString(),
                updatedBy: auth.currentUser.email || 'Unknown user'
              };
              
              console.log('Starting resource update:', updatePayload);
              await updateResource(updatePayload);
              console.log('Resource update completed');
            } else {
              // Create new resource
              const newResource = {
                ...resourceData,
                userCreated: auth.currentUser.email || 'Unknown user',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                updatedBy: auth.currentUser.email || 'Unknown user'
              };
              
              await createResource(newResource);
            }

            // Refresh the resources list
            await loadResources();

            toast({
              title: "Success",
              description: editingResource ? "Resource updated successfully" : "Resource created successfully"
            });
            
            setIsModalOpen(false);
            setEditingResource(null);
          } catch (error: any) {
            console.error('Error saving resource:', error);
            toast({
              title: "Error",
              description: error.message || "Failed to save resource",
              variant: "destructive"
            });
          }
        }}
      />
    </div>
  );
}