import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/lib/firebase/firebase-config";
import type { FirebaseResource } from "@/lib/firebase/types";

type ResourceModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (resourceData: Partial<FirebaseResource>) => Promise<void>;
  resource: FirebaseResource | null;
};

export function ResourceModal({ isOpen, onClose, onSave, resource }: ResourceModalProps) {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [numberOfTexts, setNumberOfTexts] = useState<string>("1");
  const [textFields, setTextFields] = useState<string[]>([""]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleTextFieldChange = (index: number, value: string) => {
    const newFields = [...textFields];
    newFields[index] = value;
    setTextFields(newFields);
  };

  const handleNumTextsChange = (value: string) => {
    setNumberOfTexts(value);
    const num = parseInt(value);
    const newFields = [...textFields];
    if (num > textFields.length) {
      while (newFields.length < num) {
        newFields.push("");
      }
    } else {
      newFields.splice(num);
    }
    setTextFields(newFields);
  };

  useEffect(() => {
    if (resource) {
      setTitle(resource.title);
      setDescription(resource.description);
      setNumberOfTexts(resource.numberOfTexts.toString());
      setTextFields(resource.textFields);
    } else {
      // Reset form when creating new resource
      setTitle("");
      setDescription("");
      setNumberOfTexts("1");
      setTextFields([""]);
    }
  }, [resource]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    const requiredFields = {
      title: "Title",
      description: "Description",
      numberOfTexts: "Number of Texts"
    };
    
    const missingFields = Object.entries(requiredFields)
      .filter(([key, _]) => !formData[key])
      .map(([_, label]) => label);
      
    if (missingFields.length > 0 || textFields.some(field => !field.trim())) {
      toast({
        title: "Error",
        description: `Please fill in all required fields: ${missingFields.join(', ')}${textFields.some(field => !field.trim()) ? ' and all text sections' : ''}`,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      if (!auth.currentUser) {
        throw new Error('User must be authenticated to save resources');
      }

      const resourceData = {
        title,
        description,
        numberOfTexts: parseInt(numberOfTexts),
        textFields: textFields.filter(text => text.trim() !== '')
      };

      await onSave(resourceData);
      toast({
        title: "Success",
        description: resource ? "Resource updated successfully" : "Resource created successfully"
      });
      onClose();
      
      // Form will be reset by the useEffect when resource changes or modal closes
    } catch (error: any) {
      console.error('Error saving resource:', error);
      toast({
        title: "Error",
        description: error.message || 'Failed to save resource',
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[350px]">
        <DialogHeader>
          <DialogTitle>{resource ? "Edit Resource" : "Create New Resource"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter resource title"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter resource description"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="numberOfTexts">Number of Texts</Label>
            <Select value={numberOfTexts} onValueChange={handleNumTextsChange}>
              <SelectTrigger>
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

          {textFields.map((text, index) => (
            <div key={index} className="space-y-2">
              <Label htmlFor={`text-${index}`}>Text {index + 1}</Label>
              <Textarea
                id={`text-${index}`}
                value={text}
                onChange={(e) => handleTextFieldChange(index, e.target.value)}
                placeholder={`Enter text ${index + 1}`}
                required
              />
            </div>
          ))}

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (resource ? "Saving..." : "Creating...") : (resource ? "Save Changes" : "Create Resource")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}