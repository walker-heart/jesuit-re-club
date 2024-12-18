import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { updateEvent } from '@/lib/firebase/events'
import { useToast } from "@/hooks/use-toast"
import type { FirebaseEvent } from '@/lib/firebase/events'
import type { FirebaseResource } from '@/lib/firebase/resources'

type EditModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: FirebaseEvent | FirebaseResource) => void;
  item: FirebaseEvent | FirebaseResource | null;
  type: 'event' | 'resource';
}

export function EditModal({ isOpen, onClose, onSave, item, type }: EditModalProps) {
  const [editedItem, setEditedItem] = useState<FirebaseEvent | FirebaseResource | null>(null);
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (item) {
      setEditedItem(item);
    }
  }, [item]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditedItem(prev => prev ? { ...prev, [name]: value } : null);
  };

  const handleSave = async () => {
    if (!editedItem) return;
    
    setIsSubmitting(true);
    try {
      if (type === 'event') {
        await updateEvent(editedItem as FirebaseEvent);
      }
      await onSave(editedItem);
      toast({
        title: "Success",
        description: `${type.charAt(0).toUpperCase() + type.slice(1)} ${item ? 'updated' : 'created'} successfully`
      });
      onClose();
    } catch (error: any) {
      console.error(`Error ${item ? 'updating' : 'creating'} ${type}:`, error);
      toast({
        title: "Error",
        description: error.message || `Failed to ${item ? 'update' : 'create'} ${type}`,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!editedItem) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit {type.charAt(0).toUpperCase() + type.slice(1)}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {type === 'event' ? (
            <>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="title" className="text-right">Title</Label>
                <Input 
                  id="title" 
                  name="title" 
                  value={(editedItem as FirebaseEvent).title} 
                  onChange={handleInputChange} 
                  className="col-span-3" 
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="date" className="text-right">Date</Label>
                <Input 
                  id="date" 
                  name="date" 
                  type="date" 
                  value={(editedItem as FirebaseEvent).date} 
                  onChange={handleInputChange} 
                  className="col-span-3" 
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="time" className="text-right">Time</Label>
                <Input 
                  id="time" 
                  name="time" 
                  type="time" 
                  value={(editedItem as FirebaseEvent).time} 
                  onChange={handleInputChange} 
                  className="col-span-3" 
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="location" className="text-right">Location</Label>
                <Input 
                  id="location" 
                  name="location" 
                  value={(editedItem as FirebaseEvent).location} 
                  onChange={handleInputChange} 
                  className="col-span-3" 
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="speaker" className="text-right">Speaker</Label>
                <Input 
                  id="speaker" 
                  name="speaker" 
                  value={(editedItem as FirebaseEvent).speaker} 
                  onChange={handleInputChange} 
                  className="col-span-3" 
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="speakerDescription" className="text-right">Speaker Description</Label>
                <Textarea 
                  id="speakerDescription" 
                  name="speakerDescription" 
                  value={(editedItem as FirebaseEvent).speakerDescription} 
                  onChange={handleInputChange} 
                  className="col-span-3" 
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="agenda" className="text-right">Agenda</Label>
                <Textarea 
                  id="agenda" 
                  name="agenda" 
                  value={(editedItem as FirebaseEvent).agenda} 
                  onChange={handleInputChange} 
                  className="col-span-3" 
                />
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="title" className="text-right">Title</Label>
                <Input 
                  id="title" 
                  name="title" 
                  value={(editedItem as FirebaseResource).title} 
                  onChange={handleInputChange} 
                  className="col-span-3" 
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">Description</Label>
                <Textarea 
                  id="description" 
                  name="description" 
                  value={(editedItem as FirebaseResource).description} 
                  onChange={handleInputChange} 
                  className="col-span-3" 
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="numberOfTexts" className="text-right">Number of Texts</Label>
                <Select 
                  value={(editedItem as FirebaseResource).numberOfTexts.toString()}
                  onValueChange={(value) => {
                    const num = parseInt(value);
                    setEditedItem(prev => {
                      if (!prev) return null;
                      const resource = prev as FirebaseResource;
                      const newTextFields = [...resource.textFields];
                      while (newTextFields.length < num) {
                        newTextFields.push("");
                      }
                      newTextFields.splice(num);
                      return {
                        ...resource,
                        numberOfTexts: num,
                        textFields: newTextFields
                      };
                    });
                  }}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select number of texts" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {(editedItem as FirebaseResource).textFields.map((text, index) => (
                <div key={index} className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor={`text-${index}`} className="text-right">Text {index + 1}</Label>
                  <Textarea
                    id={`text-${index}`}
                    value={text}
                    onChange={(e) => {
                      setEditedItem(prev => {
                        if (!prev) return null;
                        const resource = prev as FirebaseResource;
                        const newTextFields = [...resource.textFields];
                        newTextFields[index] = e.target.value;
                        return {
                          ...resource,
                          textFields: newTextFields
                        };
                      });
                    }}
                    className="col-span-3"
                    placeholder={`Enter text ${index + 1}`}
                  />
                </div>
              ))}
            </>
          )}
        </div>
        <DialogFooter>
          <Button onClick={onClose} variant="outline" disabled={isSubmitting}>Cancel</Button>
          <Button onClick={handleSave} disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
