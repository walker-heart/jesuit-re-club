import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";

interface Resource {
  title: string;
  description: string;
  slug: string;
  content?: string;
}

const resources: Resource[] = [
  {
    title: "Introduction to Real Estate",
    description: "A comprehensive guide to understanding the basics of real estate.",
    slug: "intro-to-real-estate",
    content: "Full guide content here..."
  },
  {
    title: "Real Estate Market Analysis",
    description: "Learn how to analyze real estate markets and identify trends.",
    slug: "market-analysis",
    content: "Market analysis content here..."
  },
  {
    title: "Investment Strategies",
    description: "Explore different approaches to real estate investment.",
    slug: "investment-strategies",
    content: "Investment strategies content here..."
  },
  {
    title: "Property Management",
    description: "Learn about effective property management techniques.",
    slug: "property-management",
    content: "Property management content here..."
  }
];

export function Resources() {
  const { user } = useAuth();

  return (
    <div className="w-full py-12 md:py-24 lg:py-32">
      <div className="container px-4 md:px-6 flex justify-center">
        <div className="grid gap-8 md:grid-cols-2 w-full max-w-[1000px]">
          {resources.map((resource, i) => (
            <Card key={i} className="p-6 bg-white rounded-lg shadow-lg card-hover animate-fade-in">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-[#003c71]">{resource.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">{resource.description}</p>
                <Button 
                  asChild
                  className="bg-[#b3a369] text-[#003c71] hover:bg-[#b3a369]/90 button-hover"
                >
                  <Link href={`/resources/${resource.slug}`}>Learn More →</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
