import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { ResourceModal } from "@/components/admin/ResourceModal";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { collection, addDoc, updateDoc, deleteDoc, doc, getDoc, getDocs, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { auth } from "@/lib/firebase"; // Added import for auth

interface Resource {
  id: string;
  title: string;
  description: string;
  numberOfTexts: number;
  textFields: string[];
  userCreated: string;
  createdAt: any; // Firebase Timestamp
  updatedAt: any; // Firebase Timestamp
  updatedBy: string;
}

async function fetchResources(): Promise<Resource[]> {
  try {
    const resourcesRef = collection(db, 'resources');
    const snapshot = await getDocs(resourcesRef);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Resource));
  } catch (error) {
    console.error('Error fetching resources:', error);
    throw new Error('Failed to fetch resources');
  }
}

async function createResource(resourceData: Omit<Resource, "id" | "createdAt" | "updatedAt" | "userCreated" | "updatedBy">): Promise<Resource> {
  try {
    const resourceRef = collection(db, 'resources');
    const docRef = await addDoc(resourceRef, {
      ...resourceData,
      userCreated: auth.currentUser?.displayName || auth.currentUser?.email || 'Unknown user',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      updatedBy: auth.currentUser?.displayName || auth.currentUser?.email || 'Unknown user'
    });
    
    const newDoc = await getDoc(docRef);
    if (!newDoc.exists()) {
      throw new Error('Failed to create resource: Document does not exist after creation');
    }
    
    return {
      id: docRef.id,
      ...newDoc.data()
    } as Resource;
  } catch (error) {
    console.error('Error creating resource:', error);
    throw new Error('Failed to create resource');
  }
}

async function updateResource(resourceData: Partial<Resource> & { id: string }): Promise<Resource> {
  try {
    const { id, ...updateData } = resourceData;
    const resourceRef = doc(db, 'resources', id);
    
    const updatePayload = {
      ...updateData,
      updatedAt: serverTimestamp(),
      updatedBy: auth.currentUser?.displayName || auth.currentUser?.email || 'Unknown user'
    };

    await updateDoc(resourceRef, updatePayload);

    const updatedDoc = await getDoc(resourceRef);
    if (!updatedDoc.exists()) {
      throw new Error('Resource not found after update');
    }

    return {
      id,
      ...updatedDoc.data()
    } as Resource;
  } catch (error) {
    console.error('Error updating resource:', error);
    throw new Error('Failed to update resource');
  }
}

async function deleteResource(id: string): Promise<void> {
  try {
    const resourceRef = doc(db, 'resources', id);
    await deleteDoc(resourceRef);
  } catch (error) {
    console.error('Error deleting resource:', error);
    throw new Error('Failed to delete resource');
  }
}

export function Resources() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);

  const { data: resources = [], isLoading } = useQuery({
    queryKey: ["resources"],
    queryFn: fetchResources,
  });

  const createMutation = useMutation({
    mutationFn: createResource,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resources"] });
      toast({
        title: "Success",
        description: "Resource created successfully",
      });
      setIsModalOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (resourceData: Resource) => {
      if (!resourceData.id) {
        throw new Error('Resource ID is required for update');
      }
      return updateResource(resourceData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resources"] });
      setIsModalOpen(false);
      setEditingResource(null);
      toast({
        title: "Success",
        description: "Resource updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteResource,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resources"] });
      toast({
        title: "Success",
        description: "Resource deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCreateResource = async (resourceData: Omit<Resource, "id" | "createdAt" | "updatedAt" | "userCreated" | "updatedBy">) => {
    try {
      await createMutation.mutateAsync(resourceData);
    } catch (error) {
      console.error("Error creating resource:", error);
    }
  };

  const handleUpdateResource = async (resourceData: Partial<Resource>) => {
    try {
      if (!editingResource?.id) {
        throw new Error('Resource ID is required for update');
      }

      const updatePayload = {
        id: editingResource.id,
        title: resourceData.title || editingResource.title,
        description: resourceData.description || editingResource.description,
        numberOfTexts: resourceData.numberOfTexts || editingResource.numberOfTexts,
        textFields: resourceData.textFields || editingResource.textFields,
        userCreated: editingResource.userCreated,
        createdAt: editingResource.createdAt,
        updatedAt: serverTimestamp(),
        updatedBy: user?.username || 'unknown'
      };

      await updateMutation.mutateAsync(updatePayload as Resource);
    } catch (error: any) {
      console.error("Error updating resource:", error);
      throw error;
    }
  };

  const handleDeleteResource = async (id: string) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this resource? This action cannot be undone.",
      )
    ) {
      return;
    }
    
    try {
      await deleteMutation.mutateAsync(id);
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
    <div>
      <div className="w-full py-8 md:py-12 lg:py-8">
        <div className="container px-4 md:px-6 mx-auto">
          <h1 className="text-3xl font-bold text-[#003c71] mb-6 animate-fade-in">
            Useful Resources
          </h1>
          <p className="text-gray-600 mb-8 animate-slide-up">
            Stay informed with the latest educational resources from the Real
            Estate Club
          </p>

          {/* Create Resource Button for admin/editor */}
          {user && ["admin", "editor"].includes(user.role) && (
            <div className="flex justify-end mb-8">
              <Button
                onClick={() => {
                  setEditingResource(null);
                  setIsModalOpen(true);
                }}
                className="bg-[#003c71] hover:bg-[#002c51] text-white"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create New Resource
              </Button>
            </div>
          )}

          {/* Resources Grid */}
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {isLoading ? (
              <p>Loading resources...</p>
            ) : (
              resources.map((resource) => (
                <Card
                  key={resource.id}
                  className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow duration-200"
                >
                  <CardHeader>
                    <CardTitle className="text-lg font-bold text-[#003c71]">
                      {resource.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-gray-600">{resource.description}</p>
                    <div className="flex flex-col space-y-2">
                      <Button
                        asChild
                        className="w-full justify-center bg-[#b3a369] hover:bg-[#b3a369]/90 text-[#003c71] border-none"
                      >
                        <Link href={`/resources/${resource.id}`}>
                          View Resource
                        </Link>
                      </Button>

                      {/* Edit and Delete buttons for admin/editor */}
                      {user &&
                        ["admin", "editor"].includes(user.role) && (
                          <div className="flex gap-2 mt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={() => {
                                setEditingResource(resource);
                                setIsModalOpen(true);
                              }}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              className="flex-1"
                              onClick={() => handleDeleteResource(resource.id)}
                            >
                              Delete
                            </Button>
                          </div>
                        )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
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
    </div>
  );
}