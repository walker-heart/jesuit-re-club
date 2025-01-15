import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, BookOpen, Newspaper, Edit2, Trash2 } from 'lucide-react'
import { EditModal } from './EditModal'
import { fetchEvents, deleteEvent } from '@/lib/firebase/events'
import { useToast } from "@/hooks/use-toast"
import { useAuth } from '@/hooks/useAuth'

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

export function EditorPostsTab() {
  const { user } = useAuth();
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
        const allEvents = await fetchEvents();
        
        // Filter events to only show those created by the current user
        const userEvents = allEvents.filter(event => event.userCreated === user?.username);
        
        // Sort events by date, putting upcoming events first
        const sortedEvents = userEvents.sort((a, b) => {
          const dateA = new Date(`${a.date} ${a.time}`);
          const dateB = new Date(`${b.date} ${b.time}`);
          const now = new Date();
          
          const aIsUpcoming = dateA >= now;
          const bIsUpcoming = dateB >= now;
          
          if (aIsUpcoming === bIsUpcoming) {
            return aIsUpcoming ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime();
          }
          
          return aIsUpcoming ? -1 : 1;
        });

        setPosts(prevPosts => ({
          ...prevPosts,
          events: sortedEvents
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

    if (user) {
      loadEvents();
    }
  }, [user]);

  const handleEdit = (item: EventItem | ResourceItem | NewsItem, type: 'event' | 'resource' | 'news') => {
    // Only allow editing if the user created the item
    if ('userCreated' in item && item.userCreated === user?.username) {
      setEditingItem(item);
      setEditingType(type);
    } else {
      toast({
        title: "Access Denied",
        description: "You can only edit your own posts",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (id: string | undefined | number, type: 'event' | 'resource' | 'news') => {
    if (!id || typeof id !== 'string') return;
    
    try {
      if (type === 'event') {
        // Find the event and check if the user created it
        const event = posts.events.find(e => e.id === id);
        if (!event || event.userCreated !== user?.username) {
          toast({
            title: "Access Denied",
            description: "You can only delete your own posts",
            variant: "destructive"
          });
          return;
        }

        // Confirm deletion
        if (!window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
          return;
        }

        await deleteEvent(id);
        setPosts(prevPosts => ({
          ...prevPosts,
          events: prevPosts.events.filter(event => event.id !== id)
        }));
        
        // Refresh the events list
        const updatedEvents = await fetchEvents();
        const userEvents = updatedEvents.filter(event => event.userCreated === user?.username);
        const sortedEvents = userEvents.sort((a, b) => {
          const dateA = new Date(`${a.date} ${a.time}`);
          const dateB = new Date(`${b.date} ${b.time}`);
          const now = new Date();
          const aIsUpcoming = dateA >= now;
          const bIsUpcoming = dateB >= now;
          
          if (aIsUpcoming === bIsUpcoming) {
            return aIsUpcoming ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime();
          }
          return aIsUpcoming ? -1 : 1;
        });

        setPosts(prevPosts => ({
          ...prevPosts,
          events: sortedEvents
        }));

        toast({
          title: "Success",
          description: "Event deleted successfully"
        });
      }
    } catch (error: any) {
      console.error('Error deleting item:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete item",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6">
      <Card className="col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="mr-2" />
            My Events
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
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleEdit(event, 'event')}
                    className="flex items-center gap-2"
                  >
                    <Edit2 className="h-4 w-4" />
                    Edit
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={() => handleDelete(event.id, 'event')}
                    className="flex items-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
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
        onSave={async (updatedItem) => {
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
        }}
        item={editingItem}
        type={editingType || 'event'}
      />
    </div>
  )
}
