import { useState, useEffect } from 'react';
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from '@/lib/firebase/firebase-config';
import { Loader2, Edit, Trash2, Plus } from 'lucide-react';
import type { FirebaseNews, UserInfo } from '@/lib/firebase/types';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { NewsModal } from '@/components/admin/NewsModal';
import { fetchNews, deleteNews, createNews, updateNews } from '@/lib/firebase/news';

export function News() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [news, setNews] = useState<FirebaseNews[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNews, setEditingNews] = useState<FirebaseNews | null>(null);

  const loadNews = async () => {
    try {
      setIsLoading(true);
      const allNews = await fetchNews();
      setNews(allNews);
    } catch (err: any) {
      console.error('Error fetching news:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNews();
  }, []);

  const handleDelete = async (id: string, userId: string) => {
    // Check permissions
    if (!user || (user.role !== 'admin' && user.uid !== userId)) {
      toast({
        title: "Permission Denied",
        description: "You don't have permission to delete this news article",
        variant: "destructive"
      });
      return;
    }

    if (!window.confirm('Are you sure you want to delete this news article?')) {
      return;
    }

    try {
      await deleteNews(id);
      await loadNews(); // Refresh the list
      toast({
        title: "Success",
        description: "News article deleted successfully"
      });
    } catch (err: any) {
      console.error('Error deleting news:', err);
      toast({
        title: "Error",
        description: err.message || "Failed to delete news article",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <div className="w-full py-8 md:py-12 lg:py-8">
        <div className="container px-4 md:px-6 mx-auto flex justify-center items-center">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <p>Loading news...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full py-8 md:py-12 lg:py-8">
        <div className="container px-4 md:px-6 mx-auto">
          <Card>
            <CardContent className="pt-6">
              <p className="text-red-500">Error loading news: {error}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="w-full py-8 md:py-12 lg:py-8">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-[#003c71] mb-2 animate-fade-in">Latest News</h1>
              <p className="text-gray-600 animate-slide-up">
                Stay informed with the latest updates from the Real Estate Club
              </p>
            </div>
            {user && (user.role === 'admin' || user.role === 'editor') && (
              <Button 
                onClick={() => {
                  setEditingNews(null);
                  setIsModalOpen(true);
                }}
                className="bg-[#003c71] hover:bg-[#002855] text-white flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Create News
              </Button>
            )}
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {news.map((article, index) => (
              <Card 
                key={article.id} 
                className="overflow-hidden transition-all duration-300 hover:shadow-lg animate-fade-in card-hover relative"
                style={{animationDelay: `${index * 100}ms`}}
              >
                <CardHeader>
                  <CardTitle className="text-xl text-[#003c71] hover:text-[#b3a369] transition-colors">
                    <Link href={`/news/${article.id}`}>{article.title}</Link>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500 mb-2">{new Date(article.date).toLocaleDateString()}</p>
                  <p className="text-sm text-gray-500 mb-2">By: {article.createdBy.firstName} {article.createdBy.lastName}</p>
                  <p className="text-gray-700 mb-4">{article.content.substring(0, 150)}...</p>
                  <div className="flex justify-between items-center">
                    <Button 
                      asChild 
                      className="bg-[#003c71] text-white hover:bg-[#002855] transition-colors button-hover"
                    >
                      <Link href={`/news/${article.id}`}>Read More</Link>
                    </Button>
                    {user && (user.role === 'admin' || (user.role === 'editor' && article.userId === user.uid)) && (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingNews(article);
                            setIsModalOpen(true);
                          }}
                          className="flex items-center gap-1"
                        >
                          <Edit className="h-4 w-4" />
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => article.id && handleDelete(article.id, article.userId)}
                          className="flex items-center gap-1"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <NewsModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingNews(null);
        }}
        news={editingNews}
        onSave={async (newsData) => {
          try {
            if (!user) {
              throw new Error('You must be logged in to save news');
            }

            const userInfo: UserInfo = {
              firstName: user.firstName || '',
              lastName: user.lastName || '',
              email: user.email || ''
            };

            if (editingNews) {
              // Update existing news
              await updateNews({
                ...editingNews,
                ...newsData,
                updatedAt: new Date().toISOString(),
                updatedBy: userInfo
              });
            } else {
              // Create new news
              const newNews: Omit<FirebaseNews, 'id'> = {
                ...newsData,
                title: newsData.title || '',
                content: newsData.content || '',
                date: newsData.date || new Date().toISOString(),
                userId: user.uid,
                createdBy: userInfo,
                createdAt: new Date().toISOString(),
                updatedBy: userInfo,
                updatedAt: new Date().toISOString(),
                isPublished: false,
                tags: newsData.tags || []
              };

              await createNews(newNews);
            }

            // Refresh the news list
            await loadNews();

            toast({
              title: "Success",
              description: editingNews ? "News updated successfully" : "News created successfully"
            });
            
            setIsModalOpen(false);
            setEditingNews(null);
          } catch (error: any) {
            console.error('Error saving news:', error);
            toast({
              title: "Error",
              description: error.message || "Failed to save news",
              variant: "destructive"
            });
          }
        }}
      />
    </>
  );
}
