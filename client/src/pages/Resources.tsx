import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { ResourceModal } from "@/components/admin/ResourceModal";
import { Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { fetchResources, deleteResource, updateResource, createResource, type FirebaseResource } from "@/lib/firebase/resources";
import { auth } from "@/lib/firebase/firebase-config";

// Use the FirebaseResource type from firebase/resources
type Resource = FirebaseResource;

export function Resources() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadResources = async () => {
      try {
        setIsLoading(true);
        const fetchedResources = await fetchResources();
        setResources(fetchedResources);
      } catch (error: any) {
        console.error('Error fetching resources:', error);
        toast({
          title: "Error",
          description: "Failed to load resources",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (auth.currentUser) {
      loadResources();
    }
  }, [auth.currentUser]);

  const canModifyResource = (resource: Resource) => {
    if (!auth.currentUser) return false;

    const userRole = localStorage.getItem('userRole');

    // Admins can modify all resources
    if (userRole === 'admin') return true;

    // Editors can only modify their own resources
    if (userRole === 'editor') {
      return resource.userCreated === (auth.currentUser.displayName || auth.currentUser.email);
    }

    return false;
  };

  const handleCreateResource = async (resourceData: Partial<Resource>) => {
    try {
      if (!auth.currentUser) {
        throw new Error('You must be logged in to create resources');
      }

      // Create a proper resource payload
      const newResource: Omit<FirebaseResource, 'id'> = {
        title: resourceData.title || '',
        description: resourceData.description || '',
        numberOfTexts: resourceData.numberOfTexts || 0,
        textFields: resourceData.textFields || [],
        userCreated: auth.currentUser.email || auth.currentUser.displayName || 'Unknown user',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        updatedBy: auth.currentUser.email || auth.currentUser.displayName || 'Unknown user'
      };

      await createResource(newResource);
      
      // Refresh the resources list
      const updatedResources = await fetchResources();
      setResources(updatedResources);
      setIsModalOpen(false);

      toast({
        title: "Success",
        description: "Resource created successfully",
      });
    } catch (error: any) {
      console.error("Error creating resource:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create resource",
        variant: "destructive",
      });
    }
  };

  const handleUpdateResource = async (resourceData: Partial<Resource>) => {
    try {
      if (!editingResource?.id) {
        throw new Error('Resource ID is required for update');
      }

      // Create a proper update payload
      const updatePayload: FirebaseResource = {
        ...editingResource,
        title: resourceData.title || editingResource.title,
        description: resourceData.description || editingResource.description,
        numberOfTexts: resourceData.numberOfTexts || editingResource.numberOfTexts,
        textFields: resourceData.textFields || editingResource.textFields,
        id: editingResource.id,
        userCreated: editingResource.userCreated,
        createdAt: editingResource.createdAt,
        updatedAt: new Date().toISOString(),
        updatedBy: auth.currentUser?.email || auth.currentUser?.displayName || 'Unknown user'
      };

      await updateResource(updatePayload);
      
      // Refresh the resources list
      const updatedResources = await fetchResources();
      setResources(updatedResources);
      setIsModalOpen(false);
      setEditingResource(null);

      toast({
        title: "Success",
        description: "Resource updated successfully",
      });
    } catch (error: any) {
      console.error("Error updating resource:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update resource",
        variant: "destructive",
      });
    }
  };

  const handleDeleteResource = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this resource? This action cannot be undone.')) {
      return;
    }

    try {
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
          {(['admin', 'editor'].includes(localStorage.getItem('userRole') || '')) && (
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
                <Card
                  key={resource.id}
                  className="animate-fade-in card-hover"
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div>
                        <h3 className="text-xl font-bold text-[#003c71] mb-2">
                          {resource.title}
                        </h3>
                        <p className="text-gray-600">{resource.description}</p>
                        <div className="text-sm text-gray-500 mt-2">
                          Created by: {resource.userCreated}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          asChild
                          className="bg-[#b3a369] text-[#003c71] hover:bg-[#b3a369]/90 button-hover shrink-0"
                        >
                          <Link href={`/resources/${resource.id}`}>View Details →</Link>
                        </Button>
                        {canModifyResource(resource) && (
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
                              onClick={() => handleDeleteResource(resource.id)}
                              className="flex items-center gap-2"
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Resource Modal for Create/Edit */}
        <ResourceModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingResource(null);
          }}
          onSave={editingResource ? handleUpdateResource : handleCreateResource}
          resource={editingResource}
        />
      </div>
    </div>
  );
}