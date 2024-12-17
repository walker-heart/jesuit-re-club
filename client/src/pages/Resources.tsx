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
  const response = await fetch('/api/resources');
  if (!response.ok) {
    throw new Error('Failed to fetch resources');
  }
  return response.json();
}

async function createResource(resourceData: Omit<Resource, 'id'>): Promise<Resource> {
  const response = await fetch('/api/resources', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(resourceData),
  });
  
  if (!response.ok) {
    throw new Error('Failed to create resource');
  }
  
  return response.json();
}

export function Resources() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: resources = [], isLoading } = useQuery({
    queryKey: ['resources'],
    queryFn: fetchResources,
  });

  const createMutation = useMutation({
    mutationFn: createResource,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      toast({
        title: "Success",
        description: "Resource created successfully",
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

  const handleCreateResource = async (resourceData: Omit<Resource, 'id'>) => {
    await createMutation.mutateAsync(resourceData);
  };

  return (
    <div className="w-full py-8 md:py-12 lg:py-16">
      <div className="container px-4 md:px-6 mx-auto">
        {/* Header with Create button for admin/editor */}
        {user && (user.role === 'admin' || user.role === 'editor') && (
          <div className="mb-8 flex justify-end">
            <Button
              onClick={() => setIsModalOpen(true)}
              className="bg-[#003c71] text-white hover:bg-[#002c51]"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create New Resource
            </Button>
          </div>
        )}

        {/* Resources Grid */}
        <div className="grid gap-8 md:grid-cols-2 w-full max-w-[1000px] mx-auto">
          {isLoading ? (
            <p>Loading resources...</p>
          ) : resources.map((resource) => (
            <Card key={resource.id} className="p-6 bg-white rounded-lg shadow-lg card-hover animate-fade-in">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-[#003c71]">{resource.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">{resource.description}</p>
                <div className="text-sm text-gray-500 mb-4">
                  <p>Created by: {resource.userCreated}</p>
                  <p>Created: {new Date(resource.createdAt).toLocaleDateString()}</p>
                </div>
                <Button 
                  asChild
                  className="bg-[#b3a369] text-[#003c71] hover:bg-[#b3a369]/90 button-hover"
                >
                  <Link href={`/resources/${resource.id}`}>View Resource →</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Create Resource Modal */}
        <ResourceModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleCreateResource}
        />
      </div>
    </div>
  );
}
