import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BookOpen, Edit, Trash2 } from 'lucide-react'
import { ResourceModal } from '../admin/ResourceModal'
import { useToast } from "@/hooks/use-toast"
import { useAuth } from '@/hooks/useAuth'
import { auth } from '@/lib/firebase/firebase-config'
import { fetchResources, deleteResource, type FirebaseResource, createResource, updateResource } from '@/lib/firebase/resources'

export function EditorResourcesTab() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [resources, setResources] = useState<FirebaseResource[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<FirebaseResource | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadResources = async () => {
    try {
      if (!auth.currentUser) {
        setError("User not authenticated");
        return;
      }
      
      setIsLoading(true);
      setError(null); // Clear any previous errors
      
      const allResources = await fetchResources();
      
      // Filter resources to only show those created by the current user
      const userResources = allResources.filter(resource => 
        resource.userCreated === auth.currentUser?.displayName || 
        resource.userCreated === auth.currentUser?.email
      );

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
    if (auth.currentUser) {
      loadResources();
    }
  }, [auth.currentUser]);

  const handleDelete = async (id: string) => {
    try {
      if (!auth.currentUser || !user) {
        toast({
          title: "Error",
          description: "You must be logged in to delete resources",
          variant: "destructive"
        });
        return;
      }

      // Find the resource and check permissions
      const resource = resources.find(r => r.id === id);
      if (!resource) return;

      const currentUserIdentifier = auth.currentUser.email || auth.currentUser.displayName;
      const canDelete = user.role === 'admin' || 
                       (user.role === 'editor' && resource.userCreated === currentUserIdentifier);

      if (!canDelete) {
        toast({
          title: "Access Denied",
          description: "You can only delete resources you created",
          variant: "destructive"
        });
        return;
      }

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

  const canModifyResource = (resource: FirebaseResource) => {
    if (!auth.currentUser || !user || !user.role) return false;
    
    // Get current user identifier
    const currentUserIdentifier = auth.currentUser.email || auth.currentUser.displayName;
    if (!currentUserIdentifier) return false;
    
    // Admins can modify all resources
    if (user.role === 'admin') return true;
    
    // Editors can only modify their own resources
    if (user.role === 'editor') {
      return resource.userCreated === currentUserIdentifier;
    }
    
    return false;
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
            {user && ['admin', 'editor'].includes(user.role) && (
              <Button 
                onClick={() => {
                  setEditingResource(null);
                  setIsModalOpen(true);
                }}
                className="bg-[#003c71] hover:bg-[#002c51] text-white"
              >
                Create Resource
              </Button>
            )}
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
                <div className="absolute bottom-4 right-4 space-x-2">
                  {/* Show edit/delete buttons for resources the user created */}
                  {user && auth.currentUser && (
                    (user.role === 'admin' || 
                     (user.role === 'editor' && 
                      resource.userCreated === (auth.currentUser.email || auth.currentUser.displayName)
                     )
                    ) && (
                      <>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => {
                            setEditingResource(resource);
                            setIsModalOpen(true);
                          }}
                          className="flex items-center gap-2"
                        >
                          <Edit className="h-4 w-4" />
                          Edit
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          onClick={() => resource.id && handleDelete(resource.id)}
                          className="flex items-center gap-2"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </Button>
                      </>
                    )
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

            if (!user || !['admin', 'editor'].includes(user.role)) {
              throw new Error('You do not have permission to save resources');
            }

            const currentUserIdentifier = auth.currentUser.email || auth.currentUser.displayName;
            
            if (editingResource) {
              // Only allow editing if user has permission
              if (!canModifyResource(editingResource)) {
                throw new Error('You do not have permission to edit this resource');
              }

              await updateResource({
                ...editingResource,
                ...resourceData,
                updatedAt: new Date().toISOString(),
                updatedBy: currentUserIdentifier
              } as FirebaseResource);
            } else {
              // Create new resource
              await createResource({
                ...resourceData,
                userCreated: currentUserIdentifier,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                updatedBy: currentUserIdentifier
              } as FirebaseResource);
            }

            // Refresh resources after save
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