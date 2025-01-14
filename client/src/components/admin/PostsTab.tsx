import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, BookOpen, Newspaper, Edit, Trash2 } from 'lucide-react'
import { EventModal } from './EventModal'
import { ResourceModal } from './ResourceModal'
import { NewsModal } from './NewsModal'
import { fetchEvents, deleteEvent, createEvent, updateEvent, type FirebaseEvent } from '@/lib/firebase/events'
import { fetchResources, deleteResource, createResource, updateResource } from '@/lib/firebase/resources'
import { fetchNews, deleteNews, createNews, updateNews, type FirebaseNews } from '@/lib/firebase/news'
import type { FirebaseResource } from '@/lib/firebase/types'
import { useToast } from "@/hooks/use-toast"
import { useAuth } from '@/hooks/useAuth'
import { formatTime } from "@/lib/utils/time";

export function PostsTab() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isResourceModalOpen, setIsResourceModalOpen] = useState(false);
  const [isNewsModalOpen, setIsNewsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<FirebaseEvent | null>(null);
  const [editingResource, setEditingResource] = useState<FirebaseResource | null>(null);
  const [editingNews, setEditingNews] = useState<FirebaseNews | null>(null);
  const [events, setEvents] = useState<FirebaseEvent[]>([]);
  const [resources, setResources] = useState<FirebaseResource[]>([]);
  const [news, setNews] = useState<FirebaseNews[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      if (!user) {
        return;
      }

      setIsLoading(true);
      
      const [eventsData, resourcesData, newsData] = await Promise.all([
        fetchEvents(),
        fetchResources(),
        fetchNews()
      ]);
      
      // Sort events by date, putting upcoming events first
      const sortedEvents = eventsData.sort((a, b) => {
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

      setEvents(sortedEvents);
      setResources(resourcesData);
      setNews(newsData);
    } catch (error: any) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to load data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    try {
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to delete events",
          variant: "destructive"
        });
        return;
      }

      // Find the event and check permissions
      const event = events.find(e => e.id === id);
      if (!event) return;

      const canDelete = user.role === 'admin' || 
                       (user.role === 'editor' && event.userId === user.uid);

      if (!canDelete) {
        toast({
          title: "Access Denied",
          description: "You don't have permission to delete this event",
          variant: "destructive"
        });
        return;
      }

      if (!window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
        return;
      }

      await deleteEvent(id);
      await loadData(); // Refresh the list after deletion

      toast({
        title: "Success",
        description: "Event deleted successfully"
      });
    } catch (error: any) {
      console.error('Error deleting event:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete event",
        variant: "destructive"
      });
    }
  };

  const handleDeleteResource = async (id: string) => {
    try {
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to delete resources",
          variant: "destructive"
        });
        return;
      }

      // Find the resource and check permissions
      const resource = resources.find(r => r.id === id);
      if (!resource) return;

      const canDelete = user.role === 'admin' || 
                       (user.role === 'editor' && resource.userId === user.uid);

      if (!canDelete) {
        toast({
          title: "Access Denied",
          description: "You don't have permission to delete this resource",
          variant: "destructive"
        });
        return;
      }

      if (!window.confirm('Are you sure you want to delete this resource? This action cannot be undone.')) {
        return;
      }

      await deleteResource(id);
      await loadData(); // Refresh the list after deletion

      toast({
        title: "Success",
        description: "Resource deleted successfully"
      });
    } catch (error: any) {
      console.error('Error deleting resource:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete resource",
        variant: "destructive"
      });
    }
  };

  const handleDeleteNews = async (id: string) => {
    try {
      if (!user) {
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

      const canDelete = user.role === 'admin' || 
                       (user.role === 'editor' && newsItem.userId === user.uid);

      if (!canDelete) {
        toast({
          title: "Access Denied",
          description: "You don't have permission to delete this news",
          variant: "destructive"
        });
        return;
      }

      if (!window.confirm('Are you sure you want to delete this news? This action cannot be undone.')) {
        return;
      }

      await deleteNews(id);
      await loadData(); // Refresh the list after deletion

      toast({
        title: "Success",
        description: "News deleted successfully"
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

  const handleEventCreated = async (eventData: Partial<FirebaseEvent>) => {
    try {
      if (!user) {
        throw new Error('You must be logged in to manage events');
      }

      // Validate required fields
      const requiredFields = ['title', 'date', 'time', 'location', 'speaker', 'speakerDescription', 'agenda'] as const;
      const missingFields = requiredFields.filter(field => {
        const value = eventData[field];
        return !value || value.toString().trim() === '';
      });
      
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }

      if (editingEvent) {
        // Update existing event
        await updateEvent({
          ...editingEvent,
          ...eventData
        } as FirebaseEvent);
      } else {
        // Create new event
        await createEvent({
          title: eventData.title!,
          date: eventData.date!,
          time: eventData.time!,
          location: eventData.location!,
          speaker: eventData.speaker!,
          speakerDescription: eventData.speakerDescription!,
          agenda: eventData.agenda!,
          userId: user.uid
        });
      }

      // Refresh the data
      await loadData();

      toast({
        title: "Success",
        description: editingEvent ? "Event updated successfully" : "Event created successfully"
      });
      
      setIsEventModalOpen(false);
      setEditingEvent(null);
    } catch (error: any) {
      console.error('Error saving event:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save event",
        variant: "destructive"
      });
    }
  };

  const handleResourceCreated = async (resourceData: Partial<FirebaseResource>) => {
    try {
      if (!user) {
        throw new Error('You must be logged in to manage resources');
      }

      // Validate required fields
      const requiredFields = ['title', 'description', 'numberOfTexts', 'textFields'] as const;
      const missingFields = requiredFields.filter(field => {
        const value = resourceData[field];
        return !value || (Array.isArray(value) && value.length === 0);
      });
      
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }

      if (editingResource) {
        // Update existing resource
        await updateResource({
          ...editingResource,
          ...resourceData
        } as FirebaseResource);
      } else {
        // Create new resource
        await createResource({
          title: resourceData.title!,
          description: resourceData.description!,
          numberOfTexts: resourceData.numberOfTexts!,
          textFields: resourceData.textFields!,
          userId: user.uid
        });
      }

      // Refresh the data
      await loadData();

      toast({
        title: "Success",
        description: editingResource ? "Resource updated successfully" : "Resource created successfully"
      });
      
      setIsResourceModalOpen(false);
      setEditingResource(null);
    } catch (error: any) {
      console.error('Error saving resource:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save resource",
        variant: "destructive"
      });
    }
  };

  const handleNewsCreated = async (newsData: Partial<FirebaseNews>) => {
    try {
      if (!user) {
        throw new Error('You must be logged in to manage news');
      }

      // Validate required fields
      const requiredFields = ['title', 'content', 'date'] as const;
      const missingFields = requiredFields.filter(field => {
        const value = newsData[field];
        return !value || value.toString().trim() === '';
      });
      
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }

      if (editingNews) {
        // Update existing news
        await updateNews({
          ...editingNews,
          ...newsData
        } as FirebaseNews);
      } else {
        // Create new news
        await createNews({
          title: newsData.title!,
          content: newsData.content!,
          date: newsData.date!,
          imageUrl: newsData.imageUrl,
          tags: newsData.tags,
          isPublished: false,
          userId: user.uid
        });
      }

      // Refresh the data
      await loadData();

      toast({
        title: "Success",
        description: editingNews ? "News updated successfully" : "News created successfully"
      });
      
      setIsNewsModalOpen(false);
      setEditingNews(null);
    } catch (error: any) {
      console.error('Error saving news:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save news",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Events Column */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center">
                <Calendar className="mr-2" />
                Events
              </div>
              <Button 
                onClick={() => {
                  setEditingEvent(null);
                  setIsEventModalOpen(true);
                }}
                className="bg-[#003c71] hover:bg-[#002c51] text-white"
              >
                Create Event
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-h-[600px] overflow-y-auto">
            {isLoading ? (
              <Card className="p-4">
                <p className="text-gray-600">Loading events...</p>
              </Card>
            ) : events.length === 0 ? (
              <Card className="p-4">
                <p className="text-gray-600">No events found</p>
              </Card>
            ) : events.map((event) => (
              <Card key={event.id} className="p-4 relative">
                <h3 className="text-lg font-semibold text-[#003c71] mb-2">{event.title}</h3>
                <p className="text-sm text-gray-600 mb-1">{`${event.date} at ${formatTime(event.time)}`}</p>
                <p className="text-sm text-gray-600 mb-2">{event.location}</p>
                <p className="text-sm text-gray-600 mb-2">Speaker: {event.speaker}</p>
                <p className="text-sm text-gray-500 mb-2">Created by: {event.createdBy.firstName} {event.createdBy.lastName}</p>
                <div className="absolute bottom-4 right-4 space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      setEditingEvent(event);
                      setIsEventModalOpen(true);
                    }}
                    className="flex items-center gap-2"
                  >
                    <Edit className="h-4 w-4" />
                    Edit
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={() => event.id && handleDeleteEvent(event.id)}
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

      {/* Resources Column */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center">
                <BookOpen className="mr-2" />
                Resources
              </div>
              <Button 
                onClick={() => {
                  setEditingResource(null);
                  setIsResourceModalOpen(true);
                }}
                className="bg-[#003c71] hover:bg-[#002c51] text-white"
              >
                Create Resource
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-h-[600px] overflow-y-auto">
            {isLoading ? (
              <Card className="p-4">
                <p className="text-gray-600">Loading resources...</p>
              </Card>
            ) : resources.length === 0 ? (
              <Card className="p-4">
                <p className="text-gray-600">No resources found</p>
              </Card>
            ) : resources.map((resource) => (
              <Card key={resource.id} className="p-4 relative">
                <h3 className="text-lg font-semibold text-[#003c71] mb-2">{resource.title}</h3>
                <p className="text-sm text-gray-600 mb-2">{resource.description}</p>
                <p className="text-sm text-gray-500 mb-2">Created by: {resource.createdBy.firstName} {resource.createdBy.lastName}</p>
                <div className="absolute bottom-4 right-4 space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      setEditingResource(resource);
                      setIsResourceModalOpen(true);
                    }}
                    className="flex items-center gap-2"
                  >
                    <Edit className="h-4 w-4" />
                    Edit
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={() => resource.id && handleDeleteResource(resource.id)}
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

      {/* News Column */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center">
                <Newspaper className="mr-2" />
                News
              </div>
              <Button 
                onClick={() => {
                  setEditingNews(null);
                  setIsNewsModalOpen(true);
                }}
                className="bg-[#003c71] hover:bg-[#002c51] text-white"
              >
                Create News
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-h-[600px] overflow-y-auto">
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
                <p className="text-sm text-gray-500 mb-2">Created by: {newsItem.createdBy.firstName} {newsItem.createdBy.lastName}</p>
                <p className="text-sm text-gray-500 mb-2">Date: {new Date(newsItem.date).toLocaleDateString()}</p>
                <div className="absolute bottom-4 right-4 space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      setEditingNews(newsItem);
                      setIsNewsModalOpen(true);
                    }}
                    className="flex items-center gap-2"
                  >
                    <Edit className="h-4 w-4" />
                    Edit
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={() => newsItem.id && handleDeleteNews(newsItem.id)}
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

      <EventModal
        isOpen={isEventModalOpen}
        onClose={() => {
          setIsEventModalOpen(false);
          setEditingEvent(null);
        }}
        onEventCreated={handleEventCreated}
        event={editingEvent}
      />

      <ResourceModal
        isOpen={isResourceModalOpen}
        onClose={() => {
          setIsResourceModalOpen(false);
          setEditingResource(null);
        }}
        onSave={handleResourceCreated}
        resource={editingResource}
      />

      <NewsModal
        isOpen={isNewsModalOpen}
        onClose={() => {
          setIsNewsModalOpen(false);
          setEditingNews(null);
        }}
        onSave={handleNewsCreated}
        news={editingNews}
      />
    </div>
  );
}