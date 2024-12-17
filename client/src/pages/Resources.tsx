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
    <div>
      <div className="w-full bg-[#003c71] text-white py-6">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl">News</h1>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-[#003c71] mb-2">Latest Resources</h2>
          <p className="text-gray-600">Stay informed with the latest educational resources from the Real Estate Club</p>
        </div>

        {/* Create Resource Button for admin/editor */}
        {user && (user.role === 'admin' || user.role === 'editor') && (
          <div className="flex justify-end mb-8">
            <Button
              onClick={() => setIsModalOpen(true)}
              className="bg-[#003c71] hover:bg-[#002c51] text-white"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create New Resource
            </Button>
          </div>
        )}

        {/* Resources Grid */}
        <div className="grid gap-8 md:grid-cols-2 w-full max-w-[1200px] mx-auto">
          {isLoading ? (
            <p>Loading resources...</p>
          ) : resources.map((resource) => (
            <Card key={resource.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow duration-200">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-[#003c71]">{resource.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-600">{resource.description}</p>
                <Button 
                  asChild
                  className="w-full justify-center bg-[#b3a369] hover:bg-[#b3a369]/90 text-[#003c71] border-none"
                >
                  <Link href={`/resources/${resource.id}`}>Learn More</Link>
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
