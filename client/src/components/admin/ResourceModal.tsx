import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/lib/firebase";

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
  onSave: (resourceData: Omit<Resource, "id">) => Promise<void>;
  resource: Resource | null;
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
    }
  }, [resource]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !description || !numberOfTexts || textFields.some(field => !field.trim())) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('You must be logged in to create a resource');
      }

      const token = await currentUser.getIdToken();
      
      const response = await fetch('/api/resources' + (resource ? `/update/${resource.id}` : '/create'), {
        method: resource ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          description,
          numberOfTexts: parseInt(numberOfTexts),
          textFields: textFields.filter(text => text.trim() !== ''),
          id: resource?.id
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to create resource');
      }

      toast({
        title: "Success",
        description: resource ? "Resource updated successfully" : "Resource created successfully",
      });

      setTitle("");
      setDescription("");
      setNumberOfTexts("1");
      setTextFields([""]);
      onClose();
    } catch (error: any) {
      console.error('Error creating resource:', error);
      toast({
        title: "Error",
        description: error.message || 'Failed to create resource',
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