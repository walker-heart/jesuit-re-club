import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
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
  const [editedItem, setEditedItem] = useState<FirebaseEvent | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (item) {
      setEditedItem({
        ...item,
        title: item.title || '',
        date: item.date || '',
        time: item.time || '',
        location: item.location || '',
        speaker: item.speaker || '',
        speakerDescription: item.speakerDescription || '',
        agenda: item.agenda || '',
      });
    } else {
      setEditedItem(null);
    }
  }, [item, isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditedItem(prev => prev ? {
      ...prev,
      [name]: value
    } : null);
  };

  const handleSave = async () => {
    if (!editedItem) return;
    
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

      await onSave(editedItem);
      onClose();
    } catch (error: any) {
      console.error('Error saving event:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save event",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!editedItem) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>
            {item ? 'Edit' : 'Create New'} Event
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-2">
          <div className="grid grid-cols-4 items-center gap-3">
            <Label htmlFor="title" className="text-right text-sm">Title</Label>
            <Input 
              id="title" 
              name="title" 
              value={editedItem.title} 
              onChange={handleInputChange}
              className="col-span-3 h-8" 
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-3">
            <Label htmlFor="date" className="text-right text-sm">Date</Label>
            <Input 
              id="date" 
              name="date" 
              type="date" 
              value={editedItem.date} 
              onChange={handleInputChange}
              className="col-span-3 h-8" 
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-3">
            <Label htmlFor="time" className="text-right text-sm">Time</Label>
            <Input 
              id="time" 
              name="time" 
              type="time" 
              value={editedItem.time} 
              onChange={handleInputChange}
              className="col-span-3 h-8" 
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-3">
            <Label htmlFor="location" className="text-right text-sm">Location</Label>
            <Input 
              id="location" 
              name="location" 
              value={editedItem.location} 
              onChange={handleInputChange}
              className="col-span-3 h-8" 
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-3">
            <Label htmlFor="speaker" className="text-right text-sm">Speaker</Label>
            <Input 
              id="speaker" 
              name="speaker" 
              value={editedItem.speaker} 
              onChange={handleInputChange}
              className="col-span-3 h-8" 
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-3">
            <Label htmlFor="speakerDescription" className="text-right text-sm">Bio</Label>
            <Textarea 
              id="speakerDescription" 
              name="speakerDescription" 
              value={editedItem.speakerDescription} 
              onChange={handleInputChange}
              className="col-span-3 h-20 resize-none" 
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-3">
            <Label htmlFor="agenda" className="text-right text-sm">Agenda</Label>
            <Textarea 
              id="agenda" 
              name="agenda" 
              value={editedItem.agenda} 
              onChange={handleInputChange}
              className="col-span-3 h-20 resize-none" 
            />
          </div>
        </div>
        <DialogFooter className="mt-4">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="text-[#003c71] hover:text-[#002855]"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={isSubmitting}
            className="bg-[#003c71] hover:bg-[#002855] text-white"
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
