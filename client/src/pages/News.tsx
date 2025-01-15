import { useState, useEffect } from 'react';
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from '@/lib/firebase/firebase-config';
import { Loader2, Edit2, Trash2, Plus } from 'lucide-react';
import type { FirebaseNews, UserInfo } from '@/lib/firebase/types';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { NewsModal } from '@/components/modals/NewsModal';
import { DeleteModal } from '@/components/modals/DeleteModal';
import { fetchNews, deleteNews, createNews, updateNews } from '@/lib/firebase/news';

export function News() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [news, setNews] = useState<FirebaseNews[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingNews, setEditingNews] = useState<FirebaseNews | null>(null);
  const [deletingNews, setDeletingNews] = useState<FirebaseNews | null>(null);

  const canModifyNews = (newsItem: FirebaseNews) => {
    if (!user) return false;
    
    // Admins can modify all news
    if (user.role === 'admin') return true;
    
    // Editors can only modify their own news
    if (user.role === 'editor') {
      return newsItem.userId === user.uid;
    }
    
    return false;
  };

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

  const handleDelete = async (article: FirebaseNews) => {
    // Check permissions
    if (!user || (user.role !== 'admin' && user.uid !== article.userId)) {
      toast({
        title: "Permission Denied",
        description: "You don't have permission to delete this news article",
        variant: "destructive"
      });
      return;
    }

    setDeletingNews(article);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingNews?.id) return;

    try {
      setIsDeleting(true);
      await deleteNews(deletingNews.id);
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
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
      setDeletingNews(null);
    }
  };

  return (
    <div className="w-full py-8 md:py-12 lg:py-8">
      <div className="container px-4 md:px-6 mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#003c71] mb-2 animate-fade-in">News</h1>
            <p className="text-gray-600 animate-slide-up">
              Stay updated with the latest news and announcements
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

        <div className="grid gap-8">
          {isLoading ? (
            <Card className="p-4">
              <CardContent>
                <p className="text-gray-600">Loading news...</p>
              </CardContent>
            </Card>
          ) : error ? (
            <Card className="p-4">
              <CardContent>
                <p className="text-red-600">Error: {error}</p>
              </CardContent>
            </Card>
          ) : news.length === 0 ? (
            <Card className="p-4">
              <CardContent>
                <p className="text-gray-600">No news found</p>
              </CardContent>
            </Card>
          ) : (
            news.map((newsItem, index) => (
              <Link key={newsItem.id} href={`/news/${newsItem.id}`}>
                <Card 
                  className="overflow-hidden transition-all duration-300 hover:shadow-lg animate-fade-in cursor-pointer hover:scale-[1.02] relative"
                  style={{animationDelay: `${index * 100}ms`}}
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div>
                        <h3 className="text-xl font-bold text-[#003c71] mb-2">
                          {newsItem.title}
                        </h3>
                        <p className="text-gray-600 mb-2">{newsItem.content}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(newsItem.date).toLocaleDateString()}
                        </p>
                      </div>
                      {canModifyNews(newsItem) && (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={(e) => {
                              e.preventDefault(); // Prevent navigation
                              setEditingNews(newsItem);
                              setIsModalOpen(true);
                            }}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={(e) => {
                              e.preventDefault(); // Prevent navigation
                              handleDelete(newsItem);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          )}
        </div>

        <NewsModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingNews(null);
          }}
          news={editingNews}
          onSuccess={loadNews}
        />

        <DeleteModal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setDeletingNews(null);
          }}
          onConfirm={handleConfirmDelete}
          title="Delete News"
          message={`Are you sure you want to delete "${deletingNews?.title}"? This action cannot be undone.`}
          isDeleting={isDeleting}
        />
      </div>
    </div>
  );
}
