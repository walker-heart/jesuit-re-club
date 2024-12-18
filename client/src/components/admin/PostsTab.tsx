import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, BookOpen } from 'lucide-react'
import { EditModal } from './EditModal'
import { ResourceModal } from './ResourceModal'
import { fetchEvents, deleteEvent, type FirebaseEvent } from '@/lib/firebase/events'
import { fetchResources, deleteResource, type FirebaseResource } from '@/lib/firebase/resources'
import { useToast } from "@/hooks/use-toast"
import { auth } from '@/lib/firebase/firebase-config'

export function PostsTab() {
  const { toast } = useToast();
  const [editingEvent, setEditingEvent] = useState<FirebaseEvent | null>(null);
  const [editingResource, setEditingResource] = useState<FirebaseResource | null>(null);
  const [events, setEvents] = useState<FirebaseEvent[]>([]);
  const [resources, setResources] = useState<FirebaseResource[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        const [eventsData, resourcesData] = await Promise.all([
          fetchEvents(),
          fetchResources()
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

    loadData();
  }, [toast]);

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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Events Column */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="mr-2" />
            Events
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
          <CardTitle className="flex items-center">
            <BookOpen className="mr-2" />
            Resources
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
                <p className="text-sm text-gray-500 mb-2">Created by: {resource.userCreated}</p>
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

      {/* Edit Modal for Events */}
      <EditModal
        isOpen={!!editingEvent}
        onClose={() => setEditingEvent(null)}
        onSave={async (updatedEvent) => {
          const updatedEvents = events.map(event => 
            event.id === updatedEvent.id ? updatedEvent as FirebaseEvent : event
          );
          setEvents(updatedEvents);
          setEditingEvent(null);
        }}
        item={editingEvent}
        type="event"
      />

      {/* Resource Modal for Resources */}
      {/* Resource Modal for Resources */}
      <ResourceModal
        isOpen={!!editingResource}
        onClose={() => {
          setEditingResource(null);
        }}
        resource={editingResource}
        onSave={async (resourceData) => {
          try {
            if (!auth.currentUser) {
              throw new Error('User must be authenticated to save resources');
            }

            // Refresh resources after save
            await loadData();
            toast({
              title: "Success",
              description: "Resource updated successfully"
            });
          } catch (error: any) {
            console.error('Error saving resource:', error);
            toast({
              title: "Error",
              description: error.message || "Failed to save resource",
              variant: "destructive"
            });
          } finally {
            setEditingResource(null);
          }
        }}
      />
    </div>
  );
}
