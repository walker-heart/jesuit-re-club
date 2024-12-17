import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { updateEvent, deleteEvent } from '@/lib/firebase/events'
import { useToast } from "@/hooks/use-toast"

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

type EditModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: EventItem | ResourceItem | NewsItem) => void;
  item: EventItem | ResourceItem | NewsItem | null;
  type: 'event' | 'resource' | 'news';
}

export function EditModal({ isOpen, onClose, onSave, item, type }: EditModalProps) {
  const [editedItem, setEditedItem] = useState<EventItem | ResourceItem | NewsItem | null>(null);

  useEffect(() => {
    if (item) {
      setEditedItem(item);
    }
  }, [item]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditedItem(prev => prev ? { ...prev, [name]: value } : null);
  };

  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async () => {
    if (editedItem && type === 'event') {
      setIsSubmitting(true);
      try {
        await updateEvent(editedItem as EventItem);
        toast({
          title: "Success",
          description: "Event updated successfully"
        });
        onSave(editedItem);
        onClose();
      } catch (error: any) {
        console.error('Error updating event:', error);
        toast({
          title: "Error",
          description: error.message || "Failed to update event",
          variant: "destructive"
        });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  if (!editedItem) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit {type.charAt(0).toUpperCase() + type.slice(1)}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {type === 'event' && (
            <>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="title" className="text-right">Title</Label>
                <Input id="title" name="title" value={(editedItem as EventItem).title} onChange={handleInputChange} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="date" className="text-right">Date</Label>
                <Input id="date" name="date" type="date" value={(editedItem as EventItem).date} onChange={handleInputChange} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="time" className="text-right">Time</Label>
                <Input id="time" name="time" type="time" value={(editedItem as EventItem).time} onChange={handleInputChange} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="location" className="text-right">Location</Label>
                <Input id="location" name="location" value={(editedItem as EventItem).location} onChange={handleInputChange} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="speaker" className="text-right">Speaker</Label>
                <Input id="speaker" name="speaker" value={(editedItem as EventItem).speaker} onChange={handleInputChange} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="speakerDescription" className="text-right">Speaker Description</Label>
                <Textarea id="speakerDescription" name="speakerDescription" value={(editedItem as EventItem).speakerDescription} onChange={handleInputChange} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="agenda" className="text-right">Agenda</Label>
                <Textarea id="agenda" name="agenda" value={(editedItem as EventItem).agenda} onChange={handleInputChange} className="col-span-3" />
              </div>
            </>
          )}
          {type === 'resource' && (
            <>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="title" className="text-right">Title</Label>
                <Input id="title" name="title" value={(editedItem as ResourceItem).title} onChange={handleInputChange} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">Description</Label>
                <Textarea id="description" name="description" value={(editedItem as ResourceItem).description} onChange={handleInputChange} className="col-span-3" />
              </div>
            </>
          )}
          {type === 'news' && (
            <>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="title" className="text-right">Title</Label>
                <Input id="title" name="title" value={(editedItem as NewsItem).title} onChange={handleInputChange} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="date" className="text-right">Date</Label>
                <Input id="date" name="date" type="date" value={(editedItem as NewsItem).date} onChange={handleInputChange} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="author" className="text-right">Author</Label>
                <Input id="author" name="author" value={(editedItem as NewsItem).author} onChange={handleInputChange} className="col-span-3" />
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button onClick={onClose} variant="outline">Cancel</Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
