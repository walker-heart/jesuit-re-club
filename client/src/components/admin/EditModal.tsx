import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import type { FirebaseEvent } from '@/lib/firebase/types';

interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: FirebaseEvent) => Promise<void>;
  item: FirebaseEvent | null;
  type: 'event';
}

export function EditModal({ isOpen, onClose, onSave, item }: EditModalProps) {
  const [editedItem, setEditedItem] = useState<FirebaseEvent>({
    title: '',
    date: '',
    time: '',
    location: '',
    speaker: '',
    speakerDescription: '',
    agenda: '',
    userCreated: '',
    createdAt: new Date().toISOString()
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (item) {
      setEditedItem(item);
    } else {
      setEditedItem({
        title: '',
        date: '',
        time: '',
        location: '',
        speaker: '',
        speakerDescription: '',
        agenda: '',
        userCreated: '',
        createdAt: new Date().toISOString()
      });
    }
  }, [item, isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditedItem(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      const requiredFields = ['title', 'date', 'time', 'location', 'speaker', 'speakerDescription', 'agenda'] as const;
      const missingFields = requiredFields.filter(field => {
        const value = editedItem[field];
        return !value || value.toString().trim() === '';
      });
      
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }

      // Prepare event data with preserved fields
      const eventData: FirebaseEvent = {
        ...editedItem,
        id: item?.id, // Preserve the ID if editing
        userCreated: item?.userCreated || editedItem.userCreated,
        createdAt: item?.createdAt || editedItem.createdAt,
        updatedAt: new Date().toISOString()
      };

      await onSave(eventData);
      
      toast({
        title: "Success",
        description: `Event ${item ? 'updated' : 'created'} successfully`
      });
      onClose();
    } catch (error: any) {
      console.error(`Error ${item ? 'updating' : 'creating'} event:`, error);
      toast({
        title: "Error",
        description: error.message || `Failed to ${item ? 'update' : 'create'} event`,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {item ? 'Edit' : 'Create New'} Event
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input 
              id="title" 
              name="title" 
              value={editedItem.title} 
              onChange={handleInputChange}
              className="mt-1.5" 
            />
          </div>
          <div>
            <Label htmlFor="date">Date</Label>
            <Input 
              id="date" 
              name="date" 
              type="date" 
              value={editedItem.date} 
              onChange={handleInputChange}
              className="mt-1.5" 
            />
          </div>
          <div>
            <Label htmlFor="time">Time</Label>
            <Input 
              id="time" 
              name="time" 
              type="time" 
              value={editedItem.time} 
              onChange={handleInputChange}
              className="mt-1.5" 
            />
          </div>
          <div>
            <Label htmlFor="location">Location</Label>
            <Input 
              id="location" 
              name="location" 
              value={editedItem.location} 
              onChange={handleInputChange}
              className="mt-1.5" 
            />
          </div>
          <div>
            <Label htmlFor="speaker">Speaker</Label>
            <Input 
              id="speaker" 
              name="speaker" 
              value={editedItem.speaker} 
              onChange={handleInputChange}
              className="mt-1.5" 
            />
          </div>
          <div>
            <Label htmlFor="speakerDescription">Speaker Description</Label>
            <Textarea 
              id="speakerDescription" 
              name="speakerDescription" 
              value={editedItem.speakerDescription} 
              onChange={handleInputChange}
              className="mt-1.5 h-24" 
            />
          </div>
          <div>
            <Label htmlFor="agenda">Agenda</Label>
            <Textarea 
              id="agenda" 
              name="agenda" 
              value={editedItem.agenda} 
              onChange={handleInputChange}
              className="mt-1.5 h-24" 
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Button 
            onClick={onClose} 
            variant="outline" 
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isSubmitting}
            className="bg-[#003c71] hover:bg-[#002c51]"
          >
            {isSubmitting ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
