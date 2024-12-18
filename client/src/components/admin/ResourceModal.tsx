import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface Resource {
  id?: number;
  title: string;
  description: string;
  numberOfTexts: number;
  textFields: string[];
  userCreated?: string;
  createdAt?: string;
  updatedAt?: string;
  updatedBy?: string;
}

type ResourceModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (resourceData: Resource | Omit<Resource, "id">) => Promise<void>;
  resource: Resource | null;
};

export function ResourceModal({ isOpen, onClose, onSave, resource }: ResourceModalProps) {
  const { toast } = useToast();
  const [title, setTitle] = useState(resource?.title || "");
  const [description, setDescription] = useState(resource?.description || "");
  const [numberOfTexts, setNumberOfTexts] = useState<string>(
    resource?.numberOfTexts?.toString() || "1"
  );
  const [textFields, setTextFields] = useState<string[]>(
    resource?.textFields || [""]
  );
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

  // Reset form when modal opens/closes or resource changes
  useEffect(() => {
    if (resource) {
      setTitle(resource.title);
      setDescription(resource.description);
      setNumberOfTexts(resource.numberOfTexts.toString());
      setTextFields(resource.textFields);
    } else {
      setTitle("");
      setDescription("");
      setNumberOfTexts("1");
      setTextFields([""]);
    }
  }, [resource, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!title.trim()) {
      toast({
        title: "Error",
        description: "Title is required",
        variant: "destructive",
      });
      return;
    }

    if (!description.trim()) {
      toast({
        title: "Error",
        description: "Description is required",
        variant: "destructive",
      });
      return;
    }

    if (!numberOfTexts || parseInt(numberOfTexts) < 1) {
      toast({
        title: "Error",
        description: "Number of texts must be at least 1",
        variant: "destructive",
      });
      return;
    }

    const trimmedFields = textFields.map(field => field.trim());
    if (trimmedFields.some(field => !field)) {
      toast({
        title: "Error",
        description: "All text fields must be filled",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      let resourceData;
      
      if (resource) {
        // Update existing resource
        resourceData = {
          id: resource.id,
          title: title.trim(),
          description: description.trim(),
          numberOfTexts: parseInt(numberOfTexts),
          textFields: trimmedFields,
          updatedAt: new Date().toISOString(),
        };
      } else {
        // Create new resource
        resourceData = {
          title: title.trim(),
          description: description.trim(),
          numberOfTexts: parseInt(numberOfTexts),
          textFields: trimmedFields,
        };
      }

      await onSave(resourceData);
      toast({
        title: "Success",
        description: resource ? "Resource updated successfully" : "Resource created successfully",
      });
      onClose();
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
      <DialogContent className="sm:max-w-[600px]">
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
