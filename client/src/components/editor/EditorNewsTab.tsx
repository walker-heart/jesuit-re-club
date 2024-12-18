import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Newspaper } from 'lucide-react'
import { useToast } from "@/hooks/use-toast"
import { useAuth } from '@/hooks/useAuth'
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

type NewsItem = {
  id: string;
  title: string;
  content: string;
  date: string;
  author: string;
  userCreated: string;
  createdAt: any;
  updatedAt: any;
}

export function EditorNewsTab() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNews, setEditingNews] = useState<NewsItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadNews = async () => {
    try {
      setIsLoading(true);
      const newsRef = collection(db, 'news');
      const q = query(newsRef, where('userCreated', '==', user?.username));
      const snapshot = await getDocs(q);
      
      const userNews = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as NewsItem[];

      // Sort by date, newest first
      const sortedNews = userNews.sort((a, b) => {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });

      setNewsItems(sortedNews);
    } catch (error) {
      console.error('Error loading news:', error);
      toast({
        title: "Error",
        description: "Failed to load news",
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

  const handleDelete = async (id: string) => {
    try {
      // Find the news item and check if the user created it
      const newsItem = newsItems.find(n => n.id === id);
      if (!newsItem || newsItem.userCreated !== user?.username) {
        toast({
          title: "Access Denied",
          description: "You can only delete your own news posts",
          variant: "destructive"
        });
        return;
      }

      // Confirm deletion
      if (!window.confirm('Are you sure you want to delete this news post? This action cannot be undone.')) {
        return;
      }

      const newsRef = doc(db, 'news', id);
      await deleteDoc(newsRef);
      
      // Refresh the news list
      await loadNews();

      toast({
        title: "Success",
        description: "News post deleted successfully"
      });
    } catch (error: any) {
      console.error('Error deleting news:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete news post",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6">
      <Card className="col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Newspaper className="mr-2" />
              My News Posts
            </div>
            <Button onClick={() => setIsModalOpen(true)}>
              Create News Post
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {isLoading ? (
              <Card className="p-4">
                <p className="text-gray-600">Loading news posts...</p>
              </Card>
            ) : newsItems.length === 0 ? (
              <Card className="p-4">
                <p className="text-gray-600">No news posts found</p>
              </Card>
            ) : newsItems.map((newsItem) => (
              <Card key={newsItem.id} className="p-4 relative">
                <h3 className="text-lg font-semibold text-[#003c71] mb-2">{newsItem.title}</h3>
                <p className="text-sm text-gray-600 mb-1">Published: {new Date(newsItem.date).toLocaleDateString()}</p>
                <p className="text-sm text-gray-600 mb-2">Author: {newsItem.author}</p>
                <div className="absolute bottom-4 right-4 space-x-2">
                  <Button variant="outline" size="sm" onClick={() => {
                    setEditingNews(newsItem);
                    setIsModalOpen(true);
                  }}>Edit</Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(newsItem.id)}>Delete</Button>
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* TODO: Implement NewsModal component */}
      {/* <NewsModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingNews(null);
        }}
        news={editingNews}
      /> */}
    </div>
  );
}
