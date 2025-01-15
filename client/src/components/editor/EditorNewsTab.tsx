import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Newspaper, Edit2, Trash2, Plus } from 'lucide-react'
import { NewsModal } from '@/components/modals/NewsModal'
import { DeleteModal } from '@/components/modals/DeleteModal'
import { useToast } from "@/hooks/use-toast"
import { useAuth } from '@/hooks/useAuth'
import { auth } from '@/lib/firebase/firebase-config'
import { fetchNews, deleteNews } from '@/lib/firebase/news'
import type { FirebaseNews, UserInfo } from '@/lib/firebase/types'

export function EditorNewsTab() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [news, setNews] = useState<FirebaseNews[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingNews, setEditingNews] = useState<FirebaseNews | null>(null);
  const [deletingNews, setDeletingNews] = useState<FirebaseNews | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadNews = async () => {
    try {
      setIsLoading(true);
      const fetchedNews = await fetchNews();
      // Filter news to only show those created by the current user
      const userNews = fetchedNews.filter(newsItem => newsItem.userId === user?.uid);
      setNews(userNews);
    } catch (error: any) {
      console.error('Error loading news:', error);
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
    if (user) {
      loadNews();
    }
  }, [user]);

  const handleDelete = async (newsItem: FirebaseNews) => {
    try {
      if (!auth.currentUser) {
        toast({
          title: "Error",
          description: "You must be logged in to delete news",
          variant: "destructive"
        });
        return;
      }

      // Only allow deletion of own news
      if (newsItem.userId !== auth.currentUser.uid) {
        toast({
          title: "Permission Denied",
          description: "You can only delete your own news articles",
          variant: "destructive"
        });
        return;
      }

      setDeletingNews(newsItem);
      setIsDeleteModalOpen(true);
    } catch (error: any) {
      console.error('Error initiating delete:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to initiate delete",
        variant: "destructive"
      });
    }
  };

  const handleConfirmDelete = async () => {
    try {
      setIsDeleting(true);
      if (!deletingNews?.id) return;

      await deleteNews(deletingNews.id);
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
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
      setDeletingNews(null);
    }
  };

  const formatUserName = (userInfo: UserInfo) => {
    if (userInfo.firstName && userInfo.lastName) {
      return `${userInfo.firstName} ${userInfo.lastName}`;
    }
    return userInfo.email;
  };

  return (
    <div className="grid grid-cols-1 gap-6">
      <Card className="col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Newspaper className="mr-2" />
              My News Articles
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
                Create News Article
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {isLoading ? (
              <Card className="p-4">
                <p className="text-gray-600">Loading news...</p>
              </Card>
            ) : news.length === 0 ? (
              <Card className="p-4">
                <p className="text-gray-600">No news found</p>
              </Card>
            ) : news.map((newsItem) => (
              <Card key={newsItem.id} className="p-4 relative">
                <h3 className="text-lg font-semibold text-[#003c71] mb-2">{newsItem.title}</h3>
                <p className="text-sm text-gray-600 mb-2">{newsItem.content}</p>
                <p className="text-sm text-gray-500 mb-2">By: {formatUserName(newsItem.createdBy)}</p>
                <p className="text-sm text-gray-500 mb-2">Date: {new Date(newsItem.date).toLocaleDateString()}</p>
                {newsItem.tags && newsItem.tags.length > 0 && (
                  <p className="text-sm text-gray-500 mb-2">Tags: {newsItem.tags.join(', ')}</p>
                )}
                <p className="text-sm text-gray-500 mb-2">Created: {new Date(newsItem.createdAt).toLocaleString()} by {formatUserName(newsItem.createdBy)}</p>
                <p className="text-sm text-gray-500 mb-2">Last updated: {new Date(newsItem.updatedAt).toLocaleString()} by {formatUserName(newsItem.updatedBy)}</p>
                <div className="absolute bottom-4 right-4 space-x-2">
                  {user && newsItem.userId === auth.currentUser?.uid && (
                    <>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          setEditingNews(newsItem);
                          setIsModalOpen(true);
                        }}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDelete(newsItem)}
                      >
                        <Trash2 className="h-4 w-4" />
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
        onSuccess={loadNews}
      />

      <DeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeletingNews(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete News Article"
        message="Are you sure you want to delete this news article? This action cannot be undone."
        isDeleting={isDeleting}
      />
    </div>
  );
}
