import { useParams, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Resource {
  id: string;
  title: string;
  description: string;
  numberOfTexts: number;
  textFields: string[];
  userCreated: string;
  createdAt: any;
  updatedAt: any;
  updatedBy: string;
}

export function ResourcePage() {
  const { slug } = useParams();
  const { data: resource, isLoading, error } = useQuery<Resource>({
    queryKey: ['resource', slug],
    queryFn: async () => {
      if (!slug) throw new Error('Resource ID is required');
      const docRef = doc(db, 'resources', slug);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        throw new Error('Resource not found');
      }
      
      const data = docSnap.data();
      return {
        id: docSnap.id,
        title: data.title,
        description: data.description,
        numberOfTexts: data.numberOfTexts,
        textFields: data.textFields,
        userCreated: data.userCreated,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        updatedBy: data.updatedBy
      } as Resource;
    },
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <p>Loading resource...</p>
        </div>
      </div>
    );
  }

  if (error || !resource) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold text-[#003c71] mb-4">Resource Not Found</h1>
          <p className="text-gray-600 mb-4">The requested resource could not be found.</p>
          <Button asChild variant="outline" className="button-hover">
            <Link href="/resources">Back to Resources</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-24">
        <Button asChild variant="outline" className="mb-6 button-hover">
          <Link href="/resources">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Resources
          </Link>
        </Button>
        
        <div className="grid gap-6 max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-[#003c71] mb-4">{resource.title}</h1>
          <p className="text-gray-600 text-lg mb-8">{resource.description}</p>
          
          {resource.textFields.map((text: string, index: number) => (
            <Card key={index} className="animate-fade-in card-hover" style={{animationDelay: `${index * 100}ms`}}>
              <CardContent className="pt-6">
                <p className="text-gray-600">{text}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
