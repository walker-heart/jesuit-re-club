import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, BookOpen, Newspaper } from 'lucide-react'
import { EditModal } from './EditModal'
import { fetchEvents } from '@/lib/firebase/events'
import { useToast } from "@/hooks/use-toast"

type EventItem = {
  id?: string;
  title: string;
  date: string;
  time: string;
  location: string;
  speaker: string;
  speakerDescription: string;
  agenda: string;
  createdAt: string;
  userCreated: string;
}

type ResourceItem = {
  id: number;
  title: string;
  description: string;
}

type NewsItem = {
  id: number;
  title: string;
  date: string;
  author: string;
}

type Posts = {
  events: EventItem[];
  resources: ResourceItem[];
  news: NewsItem[];
}

export function PostsTab() {
  const { toast } = useToast();
  const [editingItem, setEditingItem] = useState<EventItem | ResourceItem | NewsItem | null>(null);
  const [editingType, setEditingType] = useState<'event' | 'resource' | 'news' | null>(null);
  const [posts, setPosts] = useState<Posts>({
    events: [],
    resources: [],
    news: []
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadEvents = async () => {
      try {
        setIsLoading(true);
        const events = await fetchEvents();
        setPosts(prevPosts => ({
          ...prevPosts,
          events
        }));
      } catch (error) {
        console.error('Error loading events:', error);
        toast({
          title: "Error",
          description: "Failed to load events",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadEvents();
  }, []);

  const handleEdit = (item: EventItem | ResourceItem | NewsItem, type: 'event' | 'resource' | 'news') => {
    setEditingItem(item);
    setEditingType(type);
  };

  const handleSave = async (updatedItem: EventItem | ResourceItem | NewsItem) => {
    if (editingType) {
      try {
        // TODO: Implement Firebase update
        setPosts(prevPosts => {
          const key = `${editingType}s` as keyof Posts;
          return {
            ...prevPosts,
            [key]: prevPosts[key].map((item: any) => 
              item.id === updatedItem.id ? updatedItem : item
            )
          };
        });
        toast({
          title: "Success",
          description: "Event updated successfully"
        });
      } catch (error) {
        console.error('Error updating event:', error);
        toast({
          title: "Error",
          description: "Failed to update event",
          variant: "destructive"
        });
      }
    }
    setEditingItem(null);
    setEditingType(null);
  };

  const handleDelete = async (id: string | number, type: 'event' | 'resource' | 'news') => {
    try {
      // TODO: Implement Firebase delete
      setPosts(prevPosts => {
        const key = `${type}s` as keyof Posts;
        return {
          ...prevPosts,
          [key]: prevPosts[key].filter((item: any) => item.id !== id)
        };
      });
      toast({
        title: "Success",
        description: "Item deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting item:', error);
      toast({
        title: "Error",
        description: "Failed to delete item",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="mr-2" />
            Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {isLoading ? (
              <Card className="p-4">
                <p className="text-gray-600">Loading events...</p>
              </Card>
            ) : posts.events.length === 0 ? (
              <Card className="p-4">
                <p className="text-gray-600">No events found</p>
              </Card>
            ) : posts.events.map((event) => (
              <Card key={event.id} className="p-4 relative">
                <h3 className="text-lg font-semibold text-[#003c71] mb-2">{event.title}</h3>
                <p className="text-sm text-gray-600 mb-1">{event.date} | {event.time}</p>
                <p className="text-sm text-gray-600 mb-2">{event.location}</p>
                <p className="text-sm text-gray-600 mb-2">Speaker: {event.speaker}</p>
                <p className="text-sm text-gray-500 mb-2">Created by: {event.userCreated}</p>
                <div className="absolute bottom-4 right-4 space-x-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(event, 'event')}>Edit</Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(event.id, 'event')}>Delete</Button>
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center">
            <BookOpen className="mr-2" />
            Resources
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {posts.resources.map((resource) => (
              <Card key={resource.id} className="p-4 relative">
                <h3 className="text-lg font-semibold text-[#003c71] mb-2">{resource.title}</h3>
                <p className="text-sm text-gray-600 mb-4">{resource.description}</p>
                <div className="absolute bottom-4 right-4 space-x-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(resource, 'resource')}>Edit</Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(resource.id, 'resource')}>Delete</Button>
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Newspaper className="mr-2" />
            News
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {posts.news.map((newsItem) => (
              <Card key={newsItem.id} className="p-4 relative">
                <h3 className="text-lg font-semibold text-[#003c71] mb-2">{newsItem.title}</h3>
                <p className="text-sm text-gray-500 mb-2">{newsItem.date}</p>
                <p className="text-sm text-gray-600 mb-4">By {newsItem.author}</p>
                <div className="absolute bottom-4 right-4 space-x-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(newsItem, 'news')}>Edit</Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(newsItem.id, 'news')}>Delete</Button>
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <EditModal
        isOpen={!!editingItem}
        onClose={() => {
          setEditingItem(null);
          setEditingType(null);
        }}
        onSave={handleSave}
        item={editingItem}
        type={editingType || 'event'}
      />
    </div>
  )
}
