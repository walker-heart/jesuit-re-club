import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// This would typically come from a database or API
const getNewsArticles = () => [
  {
    id: 1,
    slug: 'club-wins-national-competition',
    title: "Club Wins National Competition",
    date: "April 30, 2024",
    excerpt: "Our Real Estate Club team took first place in the National Real Estate Challenge. Congratulations to all participants!",
  },
  {
    id: 2,
    slug: 'new-partnership-with-local-firm',
    title: "New Partnership with Local Real Estate Firm",
    date: "March 15, 2024",
    excerpt: "We're excited to announce our new partnership with XYZ Real Estate, offering internship opportunities for our members.",
  },
  {
    id: 3,
    slug: 'upcoming-workshop-finance-fundamentals',
    title: "Upcoming Workshop: Real Estate Finance Fundamentals",
    date: "February 28, 2024",
    excerpt: "Join us for an in-depth workshop on real estate finance, led by industry expert Jane Smith.",
  },
];

export function News() {
  const newsArticles = getNewsArticles();

  return (
    <div className="w-full py-8 md:py-12 lg:py-8">
      <div className="container px-4 md:px-6 mx-auto">
        <h1 className="text-3xl font-bold text-[#003c71] mb-6 animate-fade-in">Latest News</h1>
        <p className="text-gray-600 mb-8 animate-slide-up">
          Stay informed with the latest updates from the Real Estate Club
        </p>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {newsArticles.map((article, index) => (
            <Card 
              key={article.id} 
              className="overflow-hidden transition-all duration-300 hover:shadow-lg animate-fade-in card-hover"
              style={{animationDelay: `${index * 100}ms`}}
            >
              <CardHeader>
                <CardTitle className="text-xl text-[#003c71] hover:text-[#b3a369] transition-colors">
                  <Link href={`/news/${article.slug}`}>{article.title}</Link>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500 mb-2">{article.date}</p>
                <p className="text-gray-700 mb-4">{article.excerpt}</p>
                <Button 
                  asChild 
                  className="bg-[#003c71] text-white hover:bg-[#002855] transition-colors button-hover"
                >
                  <Link href={`/news/${article.slug}`}>Read More</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
