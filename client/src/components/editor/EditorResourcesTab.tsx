import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BookOpen, Edit2, Trash2, Plus } from 'lucide-react'
import { ResourceModal } from '@/components/modals/ResourceModal'
import { DeleteModal } from '@/components/modals/DeleteModal'
import { useToast } from "@/hooks/use-toast"
import { useAuth } from '@/hooks/useAuth'
import { auth } from '@/lib/firebase/firebase-config'
import { fetchResources, deleteResource } from '@/lib/firebase/resources'
import type { FirebaseResource } from '@/lib/firebase/types'

export function EditorResourcesTab() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [resources, setResources] = useState<FirebaseResource[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<FirebaseResource | null>(null);
  const [deletingResource, setDeletingResource] = useState<FirebaseResource | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadResources = async () => {
    try {
      setIsLoading(true);
      const fetchedResources = await fetchResources();
      // Filter resources to only show those created by the current user
      const userResources = fetchedResources.filter(resource => resource.userId === user?.uid);
      setResources(userResources);
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
    if (user) {
      loadResources();
    }
  }, [user]);

  const handleDelete = async (resource: FirebaseResource) => {
    if (!resource.id || !auth.currentUser) {
      toast({
        title: "Error",
        description: "You must be logged in to delete resources",
        variant: "destructive"
      });
      return;
    }

    // Check if user owns the resource
    if (resource.userId !== auth.currentUser.uid) {
      toast({
        title: "Access Denied",
        description: "You can only delete resources you created",
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
      console.error('Error deleting resource:', error);
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
    <div className="grid grid-cols-1 gap-6">
      <Card className="col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <BookOpen className="mr-2" />
              Resources
            </div>
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
                <p className="text-sm text-gray-500 mb-2">Text fields: {resource.textFields?.length || 0}</p>
                <p className="text-sm text-gray-500 mb-2">Created at: {new Date(resource.createdAt).toLocaleString()}</p>
                {resource.updatedAt && (
                  <p className="text-sm text-gray-500 mb-2">Last updated: {new Date(resource.updatedAt).toLocaleString()}</p>
                )}
                <div className="absolute bottom-4 right-4 space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      setEditingResource(resource);
                      setIsModalOpen(true);
                    }}
                    className="flex items-center gap-2"
                  >
                    <Edit2 className="h-4 w-4" />
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
  );
}