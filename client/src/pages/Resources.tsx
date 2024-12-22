import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { ResourceModal } from "@/components/admin/ResourceModal";
import { Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { fetchResources, deleteResource, updateResource, createResource, type FirebaseResource, fetchUser } from "@/lib/firebase/resources";
import { auth } from "@/lib/firebase/firebase-config";

// Use the FirebaseResource type directly
type Resource = FirebaseResource;

export function Resources() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [resources, setResources] = useState<Resource[]>([]);
  const [users, setUsers] = useState<{ [key: string]: any }>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadResources = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const allResources = await fetchResources();
        
        // Fetch user data for each unique creator
        const uniqueCreatorIds = [...new Set(allResources.map(r => r.userId))];
        const usersData: { [key: string]: any } = {};
        
        for (const userId of uniqueCreatorIds) {
          if (userId) {
            const userData = await fetchUser(userId);
            if (userData) {
              usersData[userId] = userData;
            }
          }
        }
        
        setUsers(usersData);
        setResources(allResources);
      } catch (error: any) {
        console.error('Error loading resources:', error);
        setError(error.message || "Failed to load resources");
      } finally {
        setIsLoading(false);
      }
    };

    if (auth.currentUser) {
      loadResources();
    }
  }, [auth.currentUser]);

  const canModifyResource = (resource: Resource) => {
    if (!auth.currentUser || !user) return false;
    
    // Admins can modify all resources
    if (user.role === 'admin') return true;
    
    // Editors can only modify their own resources
    if (user.role === 'editor') {
      return resource.userId === auth.currentUser.uid;
    }
    
    return false;
  };

  const handleResourceAction = async (resourceData: Partial<Resource>, isEdit: boolean = false) => {
    try {
      if (!auth.currentUser) {
        throw new Error('You must be logged in to manage resources');
      }

      const currentUser = auth.currentUser.email || auth.currentUser.displayName || 'Unknown user';

      if (isEdit && editingResource) {
        // Update existing resource
        const updatePayload: FirebaseResource = {
          ...editingResource,
          ...resourceData,
          updatedAt: new Date().toISOString(),
          updatedBy: currentUser
        };

        await updateResource(updatePayload);
      } else {
        // Create new resource
        const newResource: Omit<FirebaseResource, 'id'> = {
          title: resourceData.title || '',
          description: resourceData.description || '',
          numberOfTexts: resourceData.numberOfTexts || 0,
          textFields: resourceData.textFields || [],
          userId: auth.currentUser.uid,
          userCreated: currentUser,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          updatedBy: currentUser
        };

        await createResource(newResource);
      }

      // Refresh resources list
      const updatedResources = await fetchResources();
      setResources(updatedResources);
      
      setIsModalOpen(false);
      setEditingResource(null);

      toast({
        title: "Success",
        description: `Resource ${isEdit ? 'updated' : 'created'} successfully`,
      });
    } catch (error: any) {
      console.error(`Error ${isEdit ? 'updating' : 'creating'} resource:`, error);
      toast({
        title: "Error",
        description: error.message || `Failed to ${isEdit ? 'update' : 'create'} resource`,
        variant: "destructive",
      });
    }
  };

  const handleCreateResource = (resourceData: Partial<Resource>) => handleResourceAction(resourceData, false);
  const handleUpdateResource = (resourceData: Partial<Resource>) => handleResourceAction(resourceData, true);

  const handleDeleteResource = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this resource? This action cannot be undone.')) {
      return;
    }

    try {
      if (!id) {
        throw new Error('Resource ID is required for deletion');
      }

      const resource = resources.find(r => r.id === id);
      if (!resource || !canModifyResource(resource)) {
        toast({
          title: "Error",
          description: "You don't have permission to delete this resource",
          variant: "destructive"
        });
        return;
      }

      await deleteResource(id);
      const updatedResources = await fetchResources();
      setResources(updatedResources);

      toast({
        title: "Success",
        description: "Resource deleted successfully",
      });
    } catch (error: any) {
      console.error("Error deleting resource:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete resource",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="w-full py-4">
      <div className="container px-4 mx-auto">
        <div className="w-full flex justify-end mb-4">
          {user && (['admin', 'editor'].includes(user.role)) && (
            <Button 
              onClick={() => setIsModalOpen(true)}
              className="bg-[#003c71] text-white hover:bg-[#002c61]"
            >
              Create New Resource
            </Button>
          )}
        </div>

        <div className="space-y-8">
          <h1 className="text-3xl font-bold text-[#003c71] mb-6 animate-fade-in">
            Useful Resources
          </h1>
          <div className="grid gap-8">
            {isLoading ? (
              <Card className="p-4">
                <p className="text-gray-600">Loading resources...</p>
              </Card>
            ) : resources.length === 0 ? (
              <Card className="p-4">
                <p className="text-gray-600">No resources found</p>
              </Card>
            ) : (
              resources.map((resource) => (
                <Card key={resource.id} className="relative">
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-[#003c71] mb-2">
                      {resource.title}
                    </h3>
                    <p className="text-gray-600 mb-4">{resource.description}</p>
                    <div className="text-sm text-gray-500">
                      Created by: {users[resource.userId] ? 
                        `${users[resource.userId].firstName || ''} ${users[resource.userId].lastName || ''}`.trim() || 'Unknown User' 
                        : 'Unknown User'}
                    </div>
                    <div className="flex gap-2 items-center mt-4">
                      <Button
                        variant="secondary"
                        asChild
                        className="bg-[#C4B26E] hover:bg-[#b3a25f] text-white"
                      >
                        <Link href={`/resources/${resource.id}`}>View Details →</Link>
                      </Button>
                      {user && (user.role === 'admin' || resource.userId === auth.currentUser?.uid) && (
                        <>
                          <Button
                            variant="outline"
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
                            onClick={() => resource.id && handleDeleteResource(resource.id)}
                            className="flex items-center gap-2"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>

        <ResourceModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingResource(null);
          }}
          resource={editingResource}
          onSave={editingResource ? handleUpdateResource : handleCreateResource}
        />
      </div>
    </div>
  );
}
