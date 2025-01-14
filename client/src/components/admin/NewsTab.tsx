import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Newspaper, Edit, Trash2, Plus } from 'lucide-react'
import { NewsModal } from './NewsModal'
import { useToast } from "@/hooks/use-toast"
import { useAuth } from '@/hooks/useAuth'
import { auth } from '@/lib/firebase/firebase-config'
import { fetchNews, deleteNews, createNews, updateNews } from '@/lib/firebase/news'
import type { FirebaseNews } from '@/lib/firebase/types'

export function NewsTab() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [news, setNews] = useState<FirebaseNews[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNews, setEditingNews] = useState<FirebaseNews | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadNews = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const allNews = await fetchNews();
      setNews(allNews);
    } catch (error: any) {
      console.error('Error loading news:', error);
      setError(error.message || "Failed to load news");
      toast({
        title: "Error",
        description: error.message || "Failed to load news",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (auth.currentUser) {
      loadNews();
    }
  }, [auth.currentUser]);

  const handleDelete = async (id: string) => {
    try {
      if (!auth.currentUser) {
        toast({
          title: "Error",
          description: "You must be logged in to delete news",
          variant: "destructive"
        });
        return;
      }

      // Find the news and check permissions
      const newsItem = news.find(n => n.id === id);
      if (!newsItem) return;

      if (!window.confirm('Are you sure you want to delete this news article? This action cannot be undone.')) {
        return;
      }

      await deleteNews(id);
      await loadNews(); // Refresh the list after deletion

      toast({
        title: "Success",
        description: "News article deleted successfully"
      });
    } catch (error: any) {
      console.error('Error deleting news:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete news",
        variant: "destructive"
      });
    }
  };

  return (
    <>
      <Card className="col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Newspaper className="mr-2" />
              News
            </div>
            <Button 
              onClick={() => {
                setEditingNews(null);
                setIsModalOpen(true);
              }}
              className="bg-[#003c71] hover:bg-[#002855] text-white flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Create News Article
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {isLoading ? (
              <Card className="p-4">
                <p className="text-gray-600">Loading news...</p>
              </Card>
            ) : error ? (
              <Card className="p-4">
                <p className="text-red-600">Error: {error}</p>
              </Card>
            ) : news.length === 0 ? (
              <Card className="p-4">
                <p className="text-gray-600">No news found</p>
              </Card>
            ) : news.map((newsItem) => (
              <Card key={newsItem.id} className="p-4 relative">
                <h3 className="text-lg font-semibold text-[#003c71] mb-2">{newsItem.title}</h3>
                <p className="text-sm text-gray-600 mb-2">{newsItem.content}</p>
                <p className="text-sm text-gray-500 mb-2">Author: {newsItem.author}</p>
                <p className="text-sm text-gray-500 mb-2">Date: {new Date(newsItem.date).toLocaleDateString()}</p>
                {newsItem.tags && newsItem.tags.length > 0 && (
                  <p className="text-sm text-gray-500 mb-2">Tags: {newsItem.tags.join(', ')}</p>
                )}
                <p className="text-sm text-gray-500 mb-2">Created at: {new Date(newsItem.createdAt).toLocaleString()}</p>
                {newsItem.updatedAt && (
                  <p className="text-sm text-gray-500 mb-2">Last updated: {new Date(newsItem.updatedAt).toLocaleString()} by {newsItem.updatedBy}</p>
                )}
                <div className="absolute bottom-4 right-4 space-x-2">
                  {user && (user.role === 'admin' || newsItem.userId === auth.currentUser?.uid) && (
                    <>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {
                          setEditingNews(newsItem);
                          setIsModalOpen(true);
                        }}
                        className="flex items-center gap-2"
                      >
                        <Edit className="h-4 w-4" />
                        Edit
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        onClick={() => newsItem.id && handleDelete(newsItem.id)}
                        className="flex items-center gap-2"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    </>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <NewsModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingNews(null);
        }}
        news={editingNews}
        onSave={async (newsData) => {
          try {
            if (!auth.currentUser) {
              throw new Error('You must be logged in to save news');
            }

            if (editingNews) {
              // Update existing news
              await updateNews({
                ...editingNews,
                ...newsData,
                updatedAt: new Date().toISOString(),
                updatedBy: auth.currentUser.displayName || auth.currentUser.email || 'Unknown user'
              });
            } else {
              // Create new news
              await createNews({
                ...newsData as FirebaseNews,
                date: newsData.date || new Date().toISOString(),
                userId: auth.currentUser.uid,
                userCreated: auth.currentUser.displayName || auth.currentUser.email || 'Unknown user',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                updatedBy: auth.currentUser.displayName || auth.currentUser.email || 'Unknown user',
                isPublished: false
              });
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
