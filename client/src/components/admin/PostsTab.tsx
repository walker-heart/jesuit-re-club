import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, BookOpen, Newspaper } from 'lucide-react'
import { EditModal } from './EditModal'
import { ResourceModal } from './ResourceModal'
import { fetchEvents, deleteEvent, createEvent, updateEvent } from '@/lib/firebase/events'
import { fetchResources, deleteResource, createResource, updateResource, fetchUser } from '@/lib/firebase/resources'
import type { FirebaseEvent, FirebaseResource } from '@/lib/firebase/types'
import { useToast } from "@/hooks/use-toast"
import { auth } from '@/lib/firebase/firebase-config'
import { fetchNews, deleteNews, createNews, updateNews } from '@/lib/firebase/news';
import type { FirebaseNews } from '@/lib/firebase/types';
import { NewsModal } from './NewsModal';


export function PostsTab() {
  const { toast } = useToast();
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isResourceModalOpen, setIsResourceModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<FirebaseEvent | null>(null);
  const [editingResource, setEditingResource] = useState<FirebaseResource | null>(null);
  const [editingNews, setEditingNews] = useState<FirebaseNews | null>(null);
  const [events, setEvents] = useState<FirebaseEvent[]>([]);
  const [resources, setResources] = useState<FirebaseResource[]>([]);
  const [news, setNews] = useState<FirebaseNews[]>([]);
  const [users, setUsers] = useState<{ [key: string]: any }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isNewsModalOpen, setIsNewsModalOpen] = useState(false);
  const loadData = async () => {
    try {
      setIsLoading(true);
      
      const [eventsData, resourcesData, newsData] = await Promise.all([
        fetchEvents(),
        fetchResources(),
        fetchNews()
      ]);

      // Fetch user data for each unique resource creator
      const uniqueCreatorIds = Array.from(new Set(resourcesData.map(r => r.userId)));
      const usersData: { [key: string]: any } = {};
      
      for (const userId of uniqueCreatorIds) {
        if (userId) {
          const userData = await fetchUser(userId);
          if (userData) {
            usersData[userId] = userData;
          }
        }
      }
      
      setUsers(usersData);
      
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

  useEffect(() => {
    loadData();
  }, []);

  const handleDeleteEvent = async (id: string) => {
    if (!id) return;
    
    try {
      if (!window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
        return;
      }

      await deleteEvent(id);
      const updatedEvents = await fetchEvents();
      setEvents(updatedEvents);
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
    if (!id) return;
    
    try {
      if (!window.confirm('Are you sure you want to delete this resource? This action cannot be undone.')) {
        return;
      }

      await deleteResource(id);
      const updatedResources = await fetchResources();
      setResources(updatedResources);
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
    if (!id) return;

    try {
      if (!window.confirm('Are you sure you want to delete this news item? This action cannot be undone.')) {
        return;
      }

      await deleteNews(id);
      const updatedNews = await fetchNews();
      setNews(updatedNews);
      toast({
        title: "Success",
        description: "News item deleted successfully"
      });
    } catch (error: any) {
      console.error('Error deleting news:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete news item",
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
                <p className="text-sm text-gray-600 mb-1">{event.date} | {event.time}</p>
                <p className="text-sm text-gray-600 mb-2">{event.location}</p>
                <p className="text-sm text-gray-600 mb-2">Speaker: {event.speaker}</p>
                <p className="text-sm text-gray-500 mb-2">Created by: {event.userCreated}</p>
                <div className="absolute bottom-4 right-4 space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setEditingEvent(event)}
                  >
                    Edit
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={() => event.id && handleDeleteEvent(event.id)}
                  >
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
                <p className="text-sm text-gray-500 mb-2">Created by: {users[resource.userId] ? 
                  `${users[resource.userId].firstName || ''} ${users[resource.userId].lastName || ''}`.trim() || 'Unknown User' 
                  : 'Unknown User'}</p>
                <div className="absolute bottom-4 right-4 space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setEditingResource(resource)}
                  >
                    Edit
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={() => resource.id && handleDeleteResource(resource.id)}
                  >
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
                <p className="text-sm text-gray-500 mb-2">Author: {newsItem.author}</p>
                <p className="text-sm text-gray-500 mb-2">Date: {new Date(newsItem.date).toLocaleDateString()}</p>
                <div className="absolute bottom-4 right-4 space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      setEditingNews(newsItem);
                      setIsNewsModalOpen(true);
                    }}
                  >
                    Edit
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={() => newsItem.id && handleDeleteNews(newsItem.id)}
                  >
                    Delete
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* News Modal */}
      <NewsModal
        isOpen={isNewsModalOpen}
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
        }}
      />
    </div>
  );
}