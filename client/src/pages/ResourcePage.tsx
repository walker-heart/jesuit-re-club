import { useParams, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

// This would typically come from a database or CMS
const resourcesContent = {
  'intro-to-real-estate': {
    title: "Introduction to Real Estate",
    description: "A comprehensive guide to understanding the basics of real estate.",
    content: [
      {
        subtitle: "What is Real Estate?",
        text: "Real estate refers to property consisting of land and the buildings on it, as well as the natural resources of the land. Real estate can be grouped into three broad categories based on its use: residential, commercial, and industrial."
      },
      {
        subtitle: "Key Concepts",
        text: "Understanding real estate involves familiarizing yourself with concepts like property rights, land use regulations, market dynamics, and valuation methods."
      },
      {
        subtitle: "Getting Started",
        text: "Whether you're interested in real estate as an investment, career path, or for personal use, it's important to understand the fundamentals of how the real estate market works."
      }
    ]
  },
  'market-analysis': {
    title: "Real Estate Market Analysis",
    description: "Learn how to analyze real estate markets and identify trends.",
    content: [
      {
        subtitle: "Understanding Market Dynamics",
        text: "Market analysis involves studying supply and demand factors, demographic trends, economic indicators, and local market conditions that affect property values."
      },
      {
        subtitle: "Key Metrics",
        text: "Important metrics include price per square foot, cap rates, vacancy rates, absorption rates, and rental rates. These help assess market performance and property values."
      },
      {
        subtitle: "Research Methods",
        text: "Learn how to gather and analyze data from multiple sources, including market reports, property listings, public records, and industry databases."
      }
    ]
  },
  'investment-strategies': {
    title: "Investment Strategies",
    description: "Explore different approaches to real estate investment.",
    content: [
      {
        subtitle: "Types of Real Estate Investments",
        text: "Learn about different investment vehicles including direct property ownership, REITs, real estate funds, and crowdfunding platforms."
      },
      {
        subtitle: "Risk Management",
        text: "Understand how to assess and mitigate various risks associated with real estate investments."
      },
      {
        subtitle: "Investment Analysis",
        text: "Master the techniques for analyzing potential investments, including cash flow analysis and ROI calculations."
      }
    ]
  },
  'property-management': {
    title: "Property Management",
    description: "Learn about effective property management techniques.",
    content: [
      {
        subtitle: "Property Management Basics",
        text: "Understand the fundamental responsibilities of property management, from tenant relations to maintenance scheduling."
      },
      {
        subtitle: "Best Practices",
        text: "Learn industry best practices for maintaining property value, ensuring tenant satisfaction, and optimizing operations."
      },
      {
        subtitle: "Technology and Tools",
        text: "Explore modern property management software and tools that can streamline operations and improve efficiency."
      }
    ]
  }
};

export function ResourcePage() {
  const { slug } = useParams();
  const resource = resourcesContent[slug as keyof typeof resourcesContent];

  if (!resource) {
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
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <Button asChild variant="outline" className="mb-6 button-hover">
            <Link href="/resources">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Resources
            </Link>
          </Button>
        
        <div className="grid gap-6 max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-[#003c71] mb-4">{resource.title}</h1>
          <p className="text-gray-600 text-lg mb-8">{resource.description}</p>
          
          {resource.content.map((section, index) => (
            <Card key={index} className="animate-fade-in card-hover" style={{animationDelay: `${index * 100}ms`}}>
              <CardHeader>
                <CardTitle className="text-xl text-[#003c71]">{section.subtitle}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">{section.text}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
