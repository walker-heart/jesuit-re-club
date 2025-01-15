import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, BookOpen, Newspaper, Edit2, Trash2, Plus } from 'lucide-react'
import { EventModal } from '@/components/modals/EventModal'
import { ResourceModal } from '@/components/modals/ResourceModal'
import { NewsModal } from '@/components/modals/NewsModal'
import { DeleteModal } from '@/components/modals/DeleteModal'
import { fetchEvents, deleteEvent, type FirebaseEvent } from '@/lib/firebase/events'
import { fetchResources, deleteResource, type FirebaseResource } from '@/lib/firebase/resources'
import { fetchNews, deleteNews } from '@/lib/firebase/news'
import type { FirebaseNews } from '@/lib/firebase/types'
import { useToast } from "@/hooks/use-toast"
import { useAuth } from '@/hooks/useAuth'
import { formatTime } from "@/lib/utils/time";

export function PostsTab() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isResourceModalOpen, setIsResourceModalOpen] = useState(false);
  const [isNewsModalOpen, setIsNewsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingEvent, setDeletingEvent] = useState<FirebaseEvent | null>(null);
  const [deletingResource, setDeletingResource] = useState<FirebaseResource | null>(null);
  const [deletingNews, setDeletingNews] = useState<FirebaseNews | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteType, setDeleteType] = useState<'event' | 'resource' | 'news'>('event');
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
      const [fetchedEvents, fetchedResources, fetchedNews] = await Promise.all([
        fetchEvents(),
        fetchResources(),
        fetchNews()
      ]);

      setEvents(fetchedEvents);
      setResources(fetchedResources);
      setNews(fetchedNews);
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

  const handleDeleteEvent = async (event: FirebaseEvent) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to delete events",
        variant: "destructive"
      });
      return;
    }

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

    setDeletingEvent(event);
    setDeleteType('event');
    setIsDeleteModalOpen(true);
  };

  const handleDeleteResource = async (resource: FirebaseResource) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to delete resources",
        variant: "destructive"
      });
      return;
    }

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

    setDeletingResource(resource);
    setDeleteType('resource');
    setIsDeleteModalOpen(true);
  };

  const handleDeleteNews = async (newsItem: FirebaseNews) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to delete news",
        variant: "destructive"
      });
      return;
    }

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

    setDeletingNews(newsItem);
    setDeleteType('news');
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      setIsDeleting(true);

      switch (deleteType) {
        case 'event':
          if (!deletingEvent?.id) return;
          await deleteEvent(deletingEvent.id);
          break;
        case 'resource':
          if (!deletingResource?.id) return;
          await deleteResource(deletingResource.id);
          break;
        case 'news':
          if (!deletingNews?.id) return;
          await deleteNews(deletingNews.id);
          break;
      }

      await loadData();
      
      toast({
        title: "Success",
        description: `${deleteType.charAt(0).toUpperCase() + deleteType.slice(1)} deleted successfully`
      });
    } catch (error: any) {
      console.error(`Error deleting ${deleteType}:`, error);
      toast({
        title: "Error",
        description: error.message || `Failed to delete ${deleteType}`,
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
      setDeletingEvent(null);
      setDeletingResource(null);
      setDeletingNews(null);
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
                    size="icon"
                    onClick={() => {
                      setEditingEvent(event);
                      setIsEventModalOpen(true);
                    }}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleDeleteEvent(event)}
                  >
                    <Trash2 className="h-4 w-4" />
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
                className="bg-[#003c71] hover:bg-[#002855] text-white flex items-center gap-2"
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
                    size="icon"
                    onClick={() => {
                      setEditingResource(resource);
                      setIsResourceModalOpen(true);
                    }}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleDeleteResource(resource)}
                  >
                    <Trash2 className="h-4 w-4" />
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
                    size="icon"
                    onClick={() => {
                      setEditingNews(newsItem);
                      setIsNewsModalOpen(true);
                    }}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleDeleteNews(newsItem)}
                  >
                    <Trash2 className="h-4 w-4" />
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
        event={editingEvent}
        onSuccess={loadData}
      />

      <ResourceModal
        isOpen={isResourceModalOpen}
        onClose={() => {
          setIsResourceModalOpen(false);
          setEditingResource(null);
        }}
        resource={editingResource}
        onSuccess={loadData}
      />

      <NewsModal
        isOpen={isNewsModalOpen}
        onClose={() => {
          setIsNewsModalOpen(false);
          setEditingNews(null);
        }}
        news={editingNews}
        onSuccess={loadData}
      />

      <DeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeletingEvent(null);
          setDeletingResource(null);
          setDeletingNews(null);
        }}
        onConfirm={handleConfirmDelete}
        title={`Delete ${deleteType.charAt(0).toUpperCase() + deleteType.slice(1)}`}
        message={`Are you sure you want to delete this ${deleteType}? This action cannot be undone.`}
        isDeleting={isDeleting}
      />
    </div>
  );
}