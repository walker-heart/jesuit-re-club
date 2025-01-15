import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { ResourceModal } from "@/components/modals/ResourceModal";
import { DeleteModal } from "@/components/modals/DeleteModal";
import { Edit2, Trash2, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { 
  fetchResources, 
  deleteResource,
  type FirebaseResource 
} from "@/lib/firebase/resources";

type Resource = FirebaseResource;

export function Resources() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [resources, setResources] = useState<Resource[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [deletingResource, setDeletingResource] = useState<Resource | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
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

    setDeletingResource(resource);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingResource?.id) return;

    try {
      setIsDeleting(true);
      await deleteResource(deletingResource.id);
      await loadResources();
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
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
      setDeletingResource(null);
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
          ) : error ? (
            <Card className="p-4">
              <CardContent>
                <p className="text-red-600">Error: {error}</p>
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
              <Link key={resource.id} href={`/resources/${resource.id}`}>
                <Card 
                  className="overflow-hidden transition-all duration-300 hover:shadow-lg animate-fade-in cursor-pointer hover:scale-[1.02] relative"
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
                      {canModifyResource(resource) && (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={(e) => {
                              e.preventDefault(); // Prevent navigation
                              setEditingResource(resource);
                              setIsModalOpen(true);
                            }}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={(e) => {
                              e.preventDefault(); // Prevent navigation
                              handleDelete(resource);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
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
          onSuccess={loadResources}
        />

        <DeleteModal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setDeletingResource(null);
          }}
          onConfirm={handleConfirmDelete}
          title="Delete Resource"
          message={`Are you sure you want to delete "${deletingResource?.title}"? This action cannot be undone.`}
          isDeleting={isDeleting}
        />
      </div>
    </div>
  );
}
