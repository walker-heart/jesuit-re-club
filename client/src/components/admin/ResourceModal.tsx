import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

type ResourceModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function ResourceModal({ isOpen, onClose }: ResourceModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [numberOfTexts, setNumberOfTexts] = useState<string>("1");
  const [textFields, setTextFields] = useState<string[]>([""]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const num = parseInt(numberOfTexts);
    setTextFields(prev => {
      const newFields = [...prev];
      if (num > prev.length) {
        while (newFields.length < num) {
          newFields.push("");
        }
      } else if (num < prev.length) {
        newFields.splice(num);
      }
      return newFields;
    });
  }, [numberOfTexts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !numberOfTexts) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Get the Firebase token
      const token = await user?.getIdToken();
      if (!token) {
        throw new Error('No token provided');
      }

      const resourceData = {
        title,
        description,
        numberOfTexts: parseInt(numberOfTexts),
        textFields: textFields.filter(text => text.trim() !== ''),
      };

      const response = await fetch('/api/resources/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(resourceData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create resource');
      }

      const result = await response.json();
      
      toast({
        title: "Success",
        description: "Resource created successfully",
      });

      // Reset form
      setTitle("");
      setDescription("");
      setNumberOfTexts("1");
      setTextFields([""]);
      onClose();
    } catch (error: any) {
      console.error('Error saving resource:', error);
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
          <DialogTitle>Create New Resource</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="numberOfTexts">Number of Texts</Label>
            <Select
              value={numberOfTexts}
              onValueChange={setNumberOfTexts}
            >
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
                onChange={(e) => {
                  const newTextFields = [...textFields];
                  newTextFields[index] = e.target.value;
                  setTextFields(newTextFields);
                }}
                required
              />
            </div>
          ))}

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Resource"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
