import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, BookOpen } from 'lucide-react'
import { EditModal } from './EditModal'
import { fetchEvents, deleteEvent, type FirebaseEvent } from '@/lib/firebase/events'
import { fetchResources, deleteResource, type FirebaseResource } from '@/lib/firebase/resources'
import { useToast } from "@/hooks/use-toast"

export function PostsTab() {
  const { toast } = useToast();
  const [editingItem, setEditingItem] = useState<FirebaseEvent | FirebaseResource | null>(null);
  const [editingType, setEditingType] = useState<'event' | 'resource' | null>(null);
  const [events, setEvents] = useState<FirebaseEvent[]>([]);
  const [resources, setResources] = useState<FirebaseResource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const [eventsData, resourcesData] = await Promise.all([
          fetchEvents(),
          fetchResources()
        ]);
        
        // Sort events by date, putting upcoming events first
        const sortedEvents = eventsData.sort((a, b) => {
          const dateA = new Date(`${a.date} ${a.time}`);
          const dateB = new Date(`${b.date} ${b.time}`);
          const now = new Date();
          
          // Check if events are upcoming or past
          const aIsUpcoming = dateA >= now;
          const bIsUpcoming = dateB >= now;
          
          if (aIsUpcoming === bIsUpcoming) {
            // If both are upcoming or both are past, sort by date
            return aIsUpcoming ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime();
          }
          
          // Put upcoming events first
          return aIsUpcoming ? -1 : 1;
        });

        setEvents(sortedEvents);
        setResources(resourcesData);
      } catch (error: any) {
        console.error('Error loading data:', error);
        setError(error.message || 'Failed to load data');
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

  const handleEdit = (item: FirebaseEvent | FirebaseResource, type: 'event' | 'resource') => {
    setEditingItem(item);
    setEditingType(type);
  };

  const handleDelete = async (id: string | undefined, type: 'event' | 'resource') => {
    if (!id) return;
    
    try {
      // Confirm deletion
      if (!window.confirm(`Are you sure you want to delete this ${type}? This action cannot be undone.`)) {
        return;
      }

      if (type === 'event') {
        await deleteEvent(id);
        const updatedEvents = await fetchEvents();
        const sortedEvents = updatedEvents.sort((a, b) => {
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
        toast({
          title: "Success",
          description: "Event deleted successfully"
        });
      } else if (type === 'resource') {
        await deleteResource(id);
        const updatedResources = await fetchResources();
        setResources(updatedResources);
        toast({
          title: "Success",
          description: "Resource deleted successfully"
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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                  <Button variant="outline" size="sm" onClick={() => handleEdit(event, 'event')}>Edit</Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(event.id, 'event')}>Delete</Button>
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

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
                <p className="text-sm text-gray-500 mb-2">Number of sections: {resource.numberOfTexts}</p>
                <p className="text-sm text-gray-500 mb-2">Created by: {resource.userCreated}</p>
                <p className="text-sm text-gray-500 mb-2">
                  Created at: {new Date(resource.createdAt).toLocaleString()}
                </p>
                {resource.updatedAt && (
                  <p className="text-sm text-gray-500 mb-2">
                    Last updated: {new Date(resource.updatedAt).toLocaleString()} by {resource.updatedBy}
                  </p>
                )}
                <div className="absolute bottom-4 right-4 space-x-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(resource, 'resource')}>Edit</Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(resource.id, 'resource')}>Delete</Button>
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
          if (editingType === 'event') {
            const updatedEvents = events.map(event => 
              event.id === updatedItem.id ? updatedItem as FirebaseEvent : event
            );
            setEvents(updatedEvents);
          } else if (editingType === 'resource') {
            const updatedResources = resources.map(resource => 
              resource.id === updatedItem.id ? updatedItem as FirebaseResource : resource
            );
            setResources(updatedResources);
          }
          setEditingItem(null);
          setEditingType(null);
        }}
        item={editingItem}
        type={editingType || 'event'}
      />
    </div>
  );
}