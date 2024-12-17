import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";

type ResourceModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (resourceData: any) => Promise<void>;
};

export function ResourceModal({ isOpen, onClose, onSave }: ResourceModalProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [numberOfTexts, setNumberOfTexts] = useState<string>("1");
  const [textFields, setTextFields] = useState<string[]>([""]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Update text fields array when number of texts changes
    const num = parseInt(numberOfTexts);
    setTextFields(prev => {
      const newFields = [...prev];
      if (num > prev.length) {
        // Add new empty fields
        while (newFields.length < num) {
          newFields.push("");
        }
      } else if (num < prev.length) {
        // Remove extra fields
        newFields.splice(num);
      }
      return newFields;
    });
  }, [numberOfTexts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !numberOfTexts) return;

    setIsSubmitting(true);
    try {
      await onSave({
        title,
        description,
        numberOfTexts: parseInt(numberOfTexts),
        textFields,
        userCreated: user?.username || "unknown",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        updatedBy: user?.username || "unknown",
      });
      
      // Reset form
      setTitle("");
      setDescription("");
      setNumberOfTexts("1");
      setTextFields([""]);
      onClose();
    } catch (error) {
      console.error('Error saving resource:', error);
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
