import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useState, useEffect } from "react"
import type { FirebaseEvent } from "@/lib/firebase/events"
import { useToast } from "@/hooks/use-toast"

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEventCreated?: (event: Partial<FirebaseEvent>) => void;
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

  useEffect(() => {
    if (event) {
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
      // Validate required fields
      const requiredFields = ['title', 'date', 'time', 'location', 'speaker', 'speakerDescription', 'agenda'] as const;
      const missingFields = requiredFields.filter(field => {
        const value = formData[field];
        return !value || value.toString().trim() === '';
      });
      
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }

      // Pass the form data to the parent component
      onEventCreated?.(formData);
      
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
      <DialogContent className="sm:max-w-[350px]">
        <DialogHeader>
          <DialogTitle>{event ? 'Edit Event' : 'Create New Event'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-3">
          <div className="grid gap-2">
            <div className="grid grid-cols-4 items-center gap-3">
              <Label htmlFor="title" className="text-right text-sm">Title</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="col-span-3 h-8"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-3">
              <Label htmlFor="date" className="text-right text-sm">Date</Label>
              <Input
                id="date"
                name="date"
                type="date"
                value={formData.date}
                onChange={handleInputChange}
                className="col-span-3 h-8"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-3">
              <Label htmlFor="time" className="text-right text-sm">Time</Label>
              <Input
                id="time"
                name="time"
                type="time"
                value={formData.time}
                onChange={handleInputChange}
                className="col-span-3 h-8"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-3">
              <Label htmlFor="location" className="text-right text-sm">Location</Label>
              <Input
                id="location"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                className="col-span-3 h-8"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-3">
              <Label htmlFor="speaker" className="text-right text-sm">Speaker</Label>
              <Input
                id="speaker"
                name="speaker"
                value={formData.speaker}
                onChange={handleInputChange}
                className="col-span-3 h-8"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-3">
              <Label htmlFor="speakerDescription" className="text-right text-sm">Bio</Label>
              <Textarea
                id="speakerDescription"
                name="speakerDescription"
                value={formData.speakerDescription}
                onChange={handleInputChange}
                className="col-span-3 h-20 resize-none"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-3">
              <Label htmlFor="agenda" className="text-right text-sm">Agenda</Label>
              <Textarea
                id="agenda"
                name="agenda"
                value={formData.agenda}
                onChange={handleInputChange}
                className="col-span-3 h-20 resize-none"
                required
              />
            </div>
          </div>
          <div className="flex justify-end gap-4 mt-4">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="text-[#003c71] hover:text-[#002855]"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-[#003c71] hover:bg-[#002855] text-white"
            >
              Save
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
