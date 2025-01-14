import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { ResourceModal } from "@/components/admin/ResourceModal";
import { Edit, Trash2, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { 
  fetchResources, 
  deleteResource, 
  updateResource, 
  createResource, 
  type FirebaseResource 
} from "@/lib/firebase/resources";

type Resource = FirebaseResource;

export function Resources() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [resources, setResources] = useState<Resource[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadResources = async () => {
      try {
        setIsLoading(true);
        const allResources = await fetchResources();
        setResources(allResources);
      } catch (error: any) {
        console.error('Error loading resources:', error);
        toast({
          title: "Error",
          description: error.message || "Failed to load resources",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadResources();
  }, []);

  const canModifyResource = (resource: Resource) => {
    if (!user) return false;
    
    // Admins can modify all resources
    if (user.role === 'admin') return true;
    
    // Editors can only modify their own resources
    if (user.role === 'editor') {
      return resource.userId === user.uid;
    }
    
    return false;
  };

  const handleDelete = async (resource: Resource) => {
    if (!resource.id || !canModifyResource(resource)) {
      toast({
        title: "Permission Denied",
        description: "You don't have permission to delete this resource",
        variant: "destructive"
      });
      return;
    }

    if (!window.confirm('Are you sure you want to delete this resource? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteResource(resource.id);
      
      // Refresh resources list
      const updatedResources = await fetchResources();
      setResources(updatedResources);

      toast({
        title: "Success",
        description: "Resource deleted successfully"
      });
    } catch (error: any) {
      console.error("Error deleting resource:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete resource",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="w-full py-8 md:py-12 lg:py-8">
      <div className="container px-4 md:px-6 mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#003c71] mb-2 animate-fade-in">Resources</h1>
            <p className="text-gray-600 animate-slide-up">
              Access helpful resources and materials
            </p>
          </div>
          {user && (user.role === 'admin' || user.role === 'editor') && (
            <Button 
              onClick={() => {
                setEditingResource(null);
                setIsModalOpen(true);
              }}
              className="bg-[#003c71] hover:bg-[#002855] text-white flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Create Resource
            </Button>
          )}
        </div>

        <div className="grid gap-8">
          {isLoading ? (
            <Card className="p-4">
              <CardContent>
                <p className="text-gray-600">Loading resources...</p>
              </CardContent>
            </Card>
          ) : resources.length === 0 ? (
            <Card className="p-4">
              <CardContent>
                <p className="text-gray-600">No resources found</p>
              </CardContent>
            </Card>
          ) : (
            resources.map((resource, index) => (
              <Card 
                key={resource.id} 
                className="overflow-hidden transition-all duration-300 hover:shadow-lg animate-fade-in card-hover relative"
                style={{animationDelay: `${index * 100}ms`}}
              >
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <h3 className="text-xl font-bold text-[#003c71] mb-2">
                        {resource.title}
                      </h3>
                      <p className="text-gray-600">{resource.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        asChild
                        className="bg-[#003c71] hover:bg-[#002855] text-white flex items-center gap-2"
                      >
                        <Link href={`/resources/${resource.id}`}>View Details</Link>
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
                            onClick={() => handleDelete(resource)}
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

        <ResourceModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingResource(null);
          }}
          resource={editingResource}
          onSave={async (resourceData) => {
            try {
              if (!user) {
                throw new Error('You must be logged in to manage resources');
              }

              if (editingResource) {
                // Update existing resource
                await updateResource({
                  ...editingResource,
                  ...resourceData,
                  updatedAt: new Date().toISOString(),
                  updatedBy: user.firstName && user.lastName 
                    ? `${user.firstName} ${user.lastName}`
                    : user.email || 'Unknown user'
                });
              } else {
                // Create new resource
                await createResource({
                  title: resourceData.title ?? '',
                  description: resourceData.description ?? '',
                  numberOfTexts: resourceData.numberOfTexts ?? 0,
                  textFields: resourceData.textFields ?? [],
                  userId: user.uid,
                  userCreated: user.firstName && user.lastName 
                    ? `${user.firstName} ${user.lastName}`
                    : user.email || 'Unknown user',
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                  updatedBy: user.firstName && user.lastName 
                    ? `${user.firstName} ${user.lastName}`
                    : user.email || 'Unknown user'
                });
              }

              // Refresh the resources list
              const fetchedResources = await fetchResources();
              setResources(fetchedResources);
              
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
    </div>
  );
}
