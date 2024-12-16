import { useState, useEffect } from 'react';
import { db, storage } from '@/lib/firebase';
import { collection, query, orderBy, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface NewsItem {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
  published: boolean;
  createdAt: string;
}

export function News() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [newArticle, setNewArticle] = useState({
    title: '',
    content: '',
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    const newsQuery = query(collection(db, 'news'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(newsQuery);
    const newsList = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate().toISOString()
    })) as NewsItem[];
    setNewsItems(newsList);
  };

  const handleImageUpload = async () => {
    if (!selectedImage) return null;
    const storageRef = ref(storage, `news/${selectedImage.name}`);
    await uploadBytes(storageRef, selectedImage);
    return getDownloadURL(storageRef);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const imageUrl = await handleImageUpload();
      await addDoc(collection(db, 'news'), {
        ...newArticle,
        imageUrl,
        published: true,
        createdAt: new Date(),
      });
      setNewArticle({
        title: '',
        content: '',
      });
      setSelectedImage(null);
      setIsDialogOpen(false);
      fetchNews();
      toast({
        title: "Success",
        description: "News article created successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create news article",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (newsId: string) => {
    try {
      await deleteDoc(doc(db, 'news', newsId));
      fetchNews();
      toast({
        title: "Success",
        description: "News article deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete news article",
        variant: "destructive"
      });
    }
  };

  const togglePublish = async (newsId: string, currentState: boolean) => {
    try {
      await updateDoc(doc(db, 'news', newsId), {
        published: !currentState
      });
      fetchNews();
      toast({
        title: "Success",
        description: `Article ${currentState ? 'unpublished' : 'published'} successfully`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update article status",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="flex justify-between items-center mb-12">
        <h1 className="text-4xl font-bold">News</h1>
        {(user?.role === 'admin' || user?.role === 'editor') && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>Add News Article</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create News Article</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  placeholder="Article Title"
                  value={newArticle.title}
                  onChange={(e) => setNewArticle({...newArticle, title: e.target.value})}
                  required
                />
                <Textarea
                  placeholder="Article Content"
                  value={newArticle.content}
                  onChange={(e) => setNewArticle({...newArticle, content: e.target.value})}
                  className="min-h-[200px]"
                  required
                />
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setSelectedImage(e.target.files?.[0] || null)}
                />
                <Button type="submit" className="w-full">Publish Article</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {newsItems.map((item) => (
          <Card key={item.id}>
            {item.imageUrl && (
              <img
                src={item.imageUrl}
                alt={item.title}
                className="w-full h-48 object-cover"
              />
            )}
            <CardHeader>
              <CardTitle>{item.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-2">
                {format(new Date(item.createdAt), 'PPp')}
              </p>
              <p className="text-muted-foreground mb-4">
                {item.content.length > 200
                  ? `${item.content.slice(0, 200)}...`
                  : item.content}
              </p>
              {(user?.role === 'admin' || user?.role === 'editor') && (
                <div className="flex gap-2">
                  <Button
                    variant={item.published ? "outline" : "default"}
                    onClick={() => togglePublish(item.id, item.published)}
                  >
                    {item.published ? 'Unpublish' : 'Publish'}
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleDelete(item.id)}
                  >
                    Delete
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
