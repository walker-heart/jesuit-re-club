import { useParams, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

// This would typically come from a database or API
const getArticle = (slug: string) => ({
  title: "Club Wins National Competition",
  date: "April 30, 2024",
  author: "John Doe",
  content: `
    <p>Our Real Estate Club team took first place in the National Real Estate Challenge. This prestigious competition brought together top schools from across the country, showcasing the best and brightest in the field of real estate studies.</p>
    <p>The team, consisting of five Jesuit Dallas students, impressed the judges with their innovative approach to a complex urban development case study. Their proposal for a mixed-use development in a rapidly growing city center stood out for its attention to sustainability, community integration, and financial viability.</p>
    <p>"We're incredibly proud of our team," said club advisor Jane Smith. "They put in countless hours of preparation and it really showed in their presentation. This win is a testament to the quality of our Real Estate Club program and the dedication of our students."</p>
    <p>The victory comes with a $10,000 prize, which the club plans to use to fund educational trips and bring in high-profile guest speakers for the upcoming academic year.</p>
    <p>Congratulations to all participants for this outstanding achievement!</p>
  `,
});

export function NewsPage() {
  const { slug } = useParams();
  const article = getArticle(slug as string);

  return (
    <div className="min-h-screen bg-gray-100 py-12">
      <div className="container mx-auto px-4">
        <Button asChild variant="outline" className="mb-6 button-hover">
          <Link href="/news">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to News
          </Link>
        </Button>

        <Card className="overflow-hidden">
          <CardContent className="p-8">
            <h1 className="text-3xl font-bold text-[#003c71] mb-4">{article.title}</h1>
            <div className="flex items-center text-gray-600 mb-6">
              <span>{article.date}</span>
              <span className="mx-2">•</span>
              <span>By {article.author}</span>
            </div>
            <div 
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: article.content }}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
