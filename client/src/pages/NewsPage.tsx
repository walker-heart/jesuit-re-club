import { useState, useEffect } from 'react';
import { useParams, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Loader2 } from "lucide-react";
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase-config';
import type { FirebaseNews } from '@/lib/firebase/types';

export function NewsPage() {
  const { slug } = useParams();
  const [article, setArticle] = useState<FirebaseNews | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchArticle = async () => {
      if (!slug) return;
      
      try {
        setIsLoading(true);
        const docRef = doc(db, 'news', slug);
        const docSnap = await getDoc(docRef);
        
        if (!docSnap.exists()) {
          setError('News article not found');
          return;
        }
        
        setArticle({
          id: docSnap.id,
          ...docSnap.data()
        } as FirebaseNews);
      } catch (err: any) {
        console.error('Error fetching news article:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchArticle();
  }, [slug]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <p>Loading article...</p>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-gray-100 py-24">
        <div className="container mx-auto px-4">
          <Button asChild variant="outline" className="mb-6 button-hover">
            <Link href="/news">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to News
            </Link>
          </Button>
          <Card>
            <CardContent className="pt-6">
              <p className="text-red-500">Error: {error || 'News article not found'}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-24">
      <div className="container mx-auto px-4">
        <Button asChild variant="outline" className="mb-6 button-hover">
          <Link href="/news">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to News
          </Link>
        </Button>

        <Card className="overflow-hidden">
          {article.imageUrl && (
            <img
              src={article.imageUrl}
              alt={article.title}
              className="w-full h-[400px] object-cover"
            />
          )}
          <CardContent className="p-8">
            <h1 className="text-3xl font-bold text-[#003c71] mb-4">{article.title}</h1>
            <div className="flex items-center text-gray-600 mb-6">
              <span>{new Date(article.date).toLocaleDateString()}</span>
              <span className="mx-2">•</span>
              <span>By {article.createdBy.firstName} {article.createdBy.lastName}</span>
            </div>
            <div 
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: article.content }}
            />
            {article.tags && article.tags.length > 0 && (
              <div className="mt-8 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  Tags: {article.tags.join(', ')}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
