import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useState, useEffect } from "react"
import { createEvent, type FirebaseEvent } from "@/lib/firebase/events"
import { useToast } from "@/hooks/use-toast"

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEventCreated?: (event: FirebaseEvent) => void;
  event?: FirebaseEvent | null;
}

export function EventModal({ isOpen, onClose, onEventCreated, event }: EventModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    time: '',
    location: '',
    speaker: '',
    speakerDescription: '',
    agenda: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Update form data when event changes or modal closes
  useEffect(() => {
    if (event) {
      console.log('Initializing form with event:', event);
      setFormData({
        title: event.title || '',
        date: event.date || '',
        time: event.time || '',
        location: event.location || '',
        speaker: event.speaker || '',
        speakerDescription: event.speakerDescription || '',
        agenda: event.agenda || ''
      });
    } else {
      // Reset form when not editing
      setFormData({
        title: '',
        date: '',
        time: '',
        location: '',
        speaker: '',
        speakerDescription: '',
        agenda: ''
      });
    }
  }, [event, isOpen]);

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      let updatedEvent;
      if (event) {
        // Update existing event
        updatedEvent = {
          ...event,
          ...formData,
          id: event.id, // Ensure ID is preserved
          userCreated: event.userCreated, // Preserve original creator
          createdAt: event.createdAt // Preserve creation timestamp
        };
      } else {
        // Create new event
        updatedEvent = await createEvent(formData);
      }
      
      onEventCreated?.(updatedEvent);
      
      toast({
        title: "Success",
        description: event ? "Event updated successfully" : "Event created successfully"
      });
      
      setFormData({
        title: '',
        date: '',
        time: '',
        location: '',
        speaker: '',
        speakerDescription: '',
        agenda: ''
      });
      
      onClose();
    } catch (error: any) {
      console.error('Error with event:', error);
      toast({
        title: "Error",
        description: error.message || `Failed to ${event ? 'update' : 'create'} event`,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{event ? 'Edit Event' : 'Create New Event'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-4">
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">Title</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="date" className="text-right">Date</Label>
              <Input
                id="date"
                name="date"
                type="date"
                value={formData.date}
                onChange={handleInputChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="time" className="text-right">Time</Label>
              <Input
                id="time"
                name="time"
                type="time"
                value={formData.time}
                onChange={handleInputChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="location" className="text-right">Location</Label>
              <Input
                id="location"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="speaker" className="text-right">Speaker</Label>
              <Input
                id="speaker"
                name="speaker"
                value={formData.speaker}
                onChange={handleInputChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="speakerDescription" className="text-right">Speaker Description</Label>
              <Textarea
                id="speakerDescription"
                name="speakerDescription"
                value={formData.speakerDescription}
                onChange={handleInputChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="agenda" className="text-right">Agenda</Label>
              <Textarea
                id="agenda"
                name="agenda"
                value={formData.agenda}
                onChange={handleInputChange}
                className="col-span-3"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting 
                ? (event ? "Updating..." : "Creating...") 
                : (event ? "Update Event" : "Create Event")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
