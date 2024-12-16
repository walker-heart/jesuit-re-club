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
    <>
      <section className="w-full py-12 md:py-24 lg:py-32 bg-[#003c71] text-white">
        <div className="container px-4 md:px-6">
          <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl animate-fade-in">
            Latest News
          </h1>
          <p className="mt-4 text-lg text-zinc-200 animate-slide-up">
            Stay informed with the latest updates from the Real Estate Club
          </p>
        </div>
      </section>
      <section className="w-full py-12 md:py-24 lg:py-32 bg-gray-50">
        <div className="container px-4 md:px-6">
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
      </section>
    </>
  );
}
