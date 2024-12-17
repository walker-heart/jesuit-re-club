import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { ResourceModal } from "@/components/admin/ResourceModal";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface Resource {
  id: number;
  title: string;
  description: string;
  numberOfTexts: number;
  textFields: string[];
  userCreated: string;
  createdAt: string;
  updatedAt: string;
  updatedBy: string;
}

async function fetchResources(): Promise<Resource[]> {
  const response = await fetch("/api/resources");
  if (!response.ok) {
    throw new Error("Failed to fetch resources");
  }
  return response.json();
}

async function createResource(
  resourceData: Omit<Resource, "id">,
): Promise<Resource> {
  const response = await fetch("/api/resources", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(resourceData),
  });

  if (!response.ok) {
    throw new Error("Failed to create resource");
  }

  return response.json();
}

async function deleteResource(id: number): Promise<void> {
  const response = await fetch(`/api/resources/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Failed to delete resource");
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

  const handleCreateResource = async (resourceData: Omit<Resource, "id">) => {
    await createMutation.mutateAsync(resourceData);
  };

  const handleDeleteResource = async (id: number) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this resource? This action cannot be undone.",
      )
    ) {
      return;
    }
    await deleteMutation.mutateAsync(id);
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
          {user && (user.role === "admin" || user.role === "editor") && (
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
                          Learn More
                        </Link>
                      </Button>

                      {/* Edit and Delete buttons for admin/editor */}
                      {user &&
                        (user.role === "admin" || user.role === "editor") && (
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
            onSave={handleCreateResource}
            resource={editingResource}
          />
        </div>
      </div>
    </div>
  );
}
