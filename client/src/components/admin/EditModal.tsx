import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import type { FirebaseEvent, FirebaseResource } from '@/lib/firebase/types';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@radix-ui/react-select'

type EditModalProps = {
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
    createdAt: new Date().toISOString(),
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setIsSubmitting(false);
    
    if (item) {
      setEditedItem(item);
    } else {
      // Initialize with empty state for new items
      setEditedItem({
        title: '',
        date: '',
        time: '',
        location: '',
        speaker: '',
        speakerDescription: '',
        agenda: '',
        userCreated: '',
        createdAt: new Date().toISOString(),
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

  const validateEventData = (data: Partial<FirebaseEvent>) => {
    if (!data.title?.trim()) return "Title is required";
    if (!data.date?.trim()) return "Date is required";
    if (!data.time?.trim()) return "Time is required";
    if (!data.location?.trim()) return "Location is required";
    if (!data.speaker?.trim()) return "Speaker is required";
    if (!data.speakerDescription?.trim()) return "Speaker description is required";
    if (!data.agenda?.trim()) return "Agenda is required";
    return null;
  };

  const handleSave = async () => {
    if (!editedItem) return;

    setIsSubmitting(true);
    try {
      const requiredFields = ['title', 'date', 'time', 'location', 'speaker', 'speakerDescription', 'agenda'] as const;
      const missingFields = requiredFields.filter(field => !editedItem[field]);
      
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }

      // Prepare event data with preserved fields
      const eventData: FirebaseEvent = {
        ...editedItem,
        id: item?.id,
        userCreated: item?.userCreated || 'Unknown',
        createdAt: item?.createdAt || new Date().toISOString(),
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

  if (!editedItem) return null;

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
                  value={(editedItem as FirebaseEvent).date || ''} 
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
                  value={(editedItem as FirebaseEvent).time || ''} 
                  onChange={handleInputChange}
                  className="mt-1.5" 
                />
              </div>
              <div>
                <Label htmlFor="location">Location</Label>
                <Input 
                  id="location" 
                  name="location" 
                  value={(editedItem as FirebaseEvent).location || ''} 
                  onChange={handleInputChange}
                  className="mt-1.5" 
                />
              </div>
              <div>
                <Label htmlFor="speaker">Speaker</Label>
                <Input 
                  id="speaker" 
                  name="speaker" 
                  value={(editedItem as FirebaseEvent).speaker || ''} 
                  onChange={handleInputChange}
                  className="mt-1.5" 
                />
              </div>
              <div>
                <Label htmlFor="speakerDescription">Speaker Description</Label>
                <Textarea 
                  id="speakerDescription" 
                  name="speakerDescription" 
                  value={(editedItem as FirebaseEvent).speakerDescription || ''} 
                  onChange={handleInputChange}
                  className="mt-1.5 h-24" 
                />
              </div>
              <div>
                <Label htmlFor="agenda">Agenda</Label>
                <Textarea 
                  id="agenda" 
                  name="agenda" 
                  value={(editedItem as FirebaseEvent).agenda || ''} 
                  onChange={handleInputChange}
                  className="mt-1.5 h-24" 
                />
              </div>
            </>
          )}
          {type === 'resource' && (
            <>
              {/* Resource form fields -  This section remains largely the same */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="title" className="text-right">Title</Label>
                <Input 
                  id="title" 
                  name="title" 
                  value={(editedItem as FirebaseResource).title || ''} 
                  onChange={handleInputChange} 
                  className="col-span-3" 
                  placeholder="Enter resource title"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">Description</Label>
                <Textarea 
                  id="description" 
                  name="description" 
                  value={(editedItem as FirebaseResource).description || ''} 
                  onChange={handleInputChange} 
                  className="col-span-3" 
                  placeholder="Enter resource description"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="numberOfTexts" className="text-right">Number of Texts</Label>
                <Select 
                  value={(editedItem as FirebaseResource).numberOfTexts?.toString() || "1"} //Handle undefined
                  onValueChange={(value) => {
                    const num = parseInt(value);
                    setEditedItem(prev => {
                      if (!prev) return null;
                      const resource = prev as FirebaseResource;
                      const newTextFields = [...resource.textFields];
                      while (newTextFields.length < num) {
                        newTextFields.push("");
                      }
                      newTextFields.length = num; //Ensure correct length
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
              {(editedItem as FirebaseResource).textFields?.map((text, index) => ( //Handle undefined
                <div key={index} className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor={`text-${index}`} className="text-right">Text {index + 1}</Label>
                  <Textarea
                    id={`text-${index}`}
                    value={text || ''} //Handle undefined
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