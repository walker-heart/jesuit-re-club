import { useState, useEffect } from "react"
import { FormModal } from "./FormModal"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Plus, Trash2 } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { useToast } from "@/hooks/use-toast"
import { updateResource, createResource } from "@/lib/firebase/resources"
import type { FirebaseResource } from "@/lib/firebase/types"

interface ResourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  resource?: FirebaseResource | null;
  onSuccess?: () => void;
}

type FormDataType = {
  title: string;
  description: string;
  textFields: string[];
  urls: Array<{ title: string; url: string; }>;
}

export function ResourceModal({ isOpen, onClose, resource, onSuccess }: ResourceModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormDataType>({
    title: "",
    description: "",
    textFields: [""],
    urls: []
  });

  // Reset form when modal is opened/closed
  useEffect(() => {
    if (isOpen) {
      if (resource) {
        // Editing existing resource
        setFormData({
          title: resource.title || "",
          description: resource.description || "",
          textFields: resource.textFields || [""],
          urls: resource.urls ? resource.urls.map(url => {
            if (typeof url === 'string') {
              // Handle old format
              return { title: 'Link', url };
            }
            return url;
          }) : []
        });
      } else {
        // Creating new resource
        setFormData({
          title: "",
          description: "",
          textFields: [""],
          urls: []
        });
      }
    }
  }, [isOpen, resource]);

  const handleTextFieldChange = (index: number, value: string) => {
    const newFields = [...formData.textFields];
    newFields[index] = value;
    setFormData({ ...formData, textFields: newFields });
  };

  const handleUrlChange = (index: number, field: 'title' | 'url', value: string) => {
    const newUrls = [...formData.urls];
    newUrls[index] = { ...newUrls[index], [field]: value };
    setFormData({ ...formData, urls: newUrls });
  };

  const addTextField = () => {
    setFormData({
      ...formData,
      textFields: [...formData.textFields, ""]
    });
  };

  const removeTextField = (index: number) => {
    const newFields = [...formData.textFields];
    newFields.splice(index, 1);
    setFormData({ ...formData, textFields: newFields });
  };

  const addUrl = () => {
    setFormData({
      ...formData,
      urls: [...formData.urls, { title: '', url: '' }]
    });
  };

  const removeUrl = (index: number) => {
    const newUrls = [...formData.urls];
    newUrls.splice(index, 1);
    setFormData({ ...formData, urls: newUrls });
  };

  const validateForm = (): boolean => {
    if (!formData.title.trim()) {
      toast({
        title: "Error",
        description: "Title is required",
        variant: "destructive"
      });
      return false;
    }
    if (!formData.description.trim()) {
      toast({
        title: "Error",
        description: "Description is required",
        variant: "destructive"
      });
      return false;
    }
    if (formData.textFields.some(field => !field.trim())) {
      toast({
        title: "Error",
        description: "All text fields must be filled",
        variant: "destructive"
      });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    try {
      if (!user) {
        throw new Error('You must be logged in to manage resources');
      }

      const resourceData = {
        title: formData.title,
        description: formData.description,
        textFields: formData.textFields.filter(text => text.trim() !== ''),
        urls: formData.urls.filter(url => url.url.trim() !== '' && url.title.trim() !== '')
      };

      if (resource?.id) {
        await updateResource({
          ...resource,
          ...resourceData,
          updatedAt: new Date().toISOString(),
          updatedBy: {
            uid: user.uid,
            email: user.email || ""
          }
        });
      } else {
        await createResource({
          ...resourceData,
          userId: user.uid,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          updatedBy: {
            uid: user.uid,
            email: user.email || ""
          }
        });
      }

      onSuccess?.();
      onClose();
      toast({
        title: "Success",
        description: resource ? "Resource updated successfully" : "Resource created successfully"
      });
    } catch (error: any) {
      console.error('Error saving resource:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save resource",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title={resource ? "Edit Resource" : "Create Resource"}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
    >
      <div className="space-y-4">
        <div>
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
            className="h-8"
          />
        </div>
        <div>
          <Label htmlFor="description">Description *</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            required
            className="min-h-[100px]"
          />
        </div>
        <div>
          <div className="flex justify-between items-center mb-2">
            <Label>Text Fields *</Label>
            <Button
              type="button"
              onClick={addTextField}
              className="bg-[#003c71] hover:bg-[#002855] text-white flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Text Field
            </Button>
          </div>
          {formData.textFields.map((text, index) => (
            <div key={index} className="flex gap-2 mb-2">
              <Textarea
                value={text}
                onChange={(e) => handleTextFieldChange(index, e.target.value)}
                placeholder={`Enter text ${index + 1}`}
                required
                className="min-h-[100px] flex-1"
              />
              {formData.textFields.length > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => removeTextField(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
        <div>
          <div className="flex justify-between items-center mb-2">
            <Label>URLs (Optional)</Label>
            <Button
              type="button"
              onClick={addUrl}
              className="bg-[#003c71] hover:bg-[#002855] text-white flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add URL
            </Button>
          </div>
          {formData.urls.map((urlItem, index) => (
            <div key={index} className="flex gap-2 mb-2">
              <div className="flex-1 flex gap-2">
                <Input
                  value={urlItem.title}
                  onChange={(e) => handleUrlChange(index, 'title', e.target.value)}
                  placeholder="Enter Link Title"
                  className="h-8 w-1/3"
                />
                <Input
                  value={urlItem.url}
                  onChange={(e) => handleUrlChange(index, 'url', e.target.value)}
                  placeholder="Enter URL"
                  className="h-8 flex-1"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => removeUrl(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </FormModal>
  );
} 