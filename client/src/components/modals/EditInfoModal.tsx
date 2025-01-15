import { useState, useEffect } from "react";
import { FormModal } from "./FormModal";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { createInfo, updateInfo } from "@/lib/firebase/info";
import type { FirebaseInfo, FirebaseUser } from "@/lib/firebase/types";

interface EditInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  info?: FirebaseInfo | null;
}

const ICON_OPTIONS = [
  { value: "none", label: "None" },
  { value: "building", label: "Building" },
  { value: "target", label: "Target" },
  { value: "trophy", label: "Trophy" },
  { value: "users", label: "Users" },
  { value: "book", label: "Book" },
  { value: "calendar", label: "Calendar" },
];

const PAGE_OPTIONS: Array<{ value: 'aboutus' | 'membership'; label: string }> = [
  { value: "aboutus", label: "About Us" },
  { value: "membership", label: "Membership" },
];

const SUB_OPTIONS: Array<{ value: 'top' | 'bottom'; label: string }> = [
  { value: "top", label: "Top" },
  { value: "bottom", label: "Bottom" },
];

type FormData = {
  title: string;
  icon: string;
  text: string;
  page: 'aboutus' | 'membership';
  sub?: 'top' | 'bottom';
  texts?: string[];
  url1Title?: string;
  url1?: string;
  url2Title?: string;
  url2?: string;
};

function AdditionalFieldsModal({ 
  isOpen, 
  onClose, 
  formData, 
  setFormData 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  formData: FormData; 
  setFormData: (data: FormData) => void;
}) {
  const addText = () => {
    setFormData({
      ...formData,
      texts: [...(formData.texts || []), ""]
    });
  };

  const removeText = (index: number) => {
    setFormData({
      ...formData,
      texts: formData.texts?.filter((_, i) => i !== index) || []
    });
  };

  const updateText = (index: number, value: string) => {
    setFormData({
      ...formData,
      texts: formData.texts?.map((text, i) => i === index ? value : text) || []
    });
  };

  const renderTopFields = () => (
    <div className="space-y-4">
      <div>
        <Label>Texts *</Label>
        <div className="space-y-2">
          {formData.texts?.map((text, index) => (
            <div key={index} className="flex gap-2">
              <Textarea
                value={text}
                onChange={(e) => updateText(index, e.target.value)}
                className="min-h-[100px] flex-1"
                placeholder={`Enter text ${index + 1}`}
              />
              {formData.texts!.length > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => removeText(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
        <Button
          type="button"
          onClick={addText}
          className="mt-2 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Text
        </Button>
      </div>
    </div>
  );

  const renderBottomFields = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="text">Text *</Label>
        <Textarea
          id="text"
          value={formData.text}
          onChange={(e) => setFormData({ ...formData, text: e.target.value })}
          required
          className="min-h-[100px]"
          placeholder="Enter text content"
        />
      </div>

      <div>
        <Label htmlFor="url1Title">URL 1 Title</Label>
        <Input
          id="url1Title"
          value={formData.url1Title}
          onChange={(e) => setFormData({ ...formData, url1Title: e.target.value })}
          className="h-8"
          placeholder="Enter URL 1 title"
        />
      </div>

      <div>
        <Label htmlFor="url1">URL 1</Label>
        <Input
          id="url1"
          value={formData.url1}
          onChange={(e) => setFormData({ ...formData, url1: e.target.value })}
          className="h-8"
          placeholder="Enter URL 1"
        />
      </div>

      <div>
        <Label htmlFor="url2Title">URL 2 Title</Label>
        <Input
          id="url2Title"
          value={formData.url2Title}
          onChange={(e) => setFormData({ ...formData, url2Title: e.target.value })}
          className="h-8"
          placeholder="Enter URL 2 title"
        />
      </div>

      <div>
        <Label htmlFor="url2">URL 2</Label>
        <Input
          id="url2"
          value={formData.url2}
          onChange={(e) => setFormData({ ...formData, url2: e.target.value })}
          className="h-8"
          placeholder="Enter URL 2"
        />
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {formData.sub === 'top' ? 'Top Section Fields' : 'Bottom Section Fields'}
          </DialogTitle>
        </DialogHeader>
        {formData.sub === 'top' ? renderTopFields() : renderBottomFields()}
      </DialogContent>
    </Dialog>
  );
}

export function EditInfoModal({ isOpen, onClose, onSuccess, info }: EditInfoModalProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAdditionalFields, setShowAdditionalFields] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    title: info?.title || "",
    icon: info?.icon || "none",
    text: info?.text || "",
    page: (info?.page as 'aboutus' | 'membership') || "aboutus",
    sub: info?.sub,
    texts: info?.texts || [""],
    url1Title: info?.url1Title || "",
    url1: info?.url1 || "",
    url2Title: info?.url2Title || "",
    url2: info?.url2 || "",
  });

  // Update useEffect to handle "none" value
  useEffect(() => {
    if (isOpen) {
      setFormData({
        title: info?.title || "",
        icon: info?.icon || "none",
        text: info?.text || "",
        page: info?.page || "aboutus",
        sub: info?.sub,
        texts: info?.texts || [""],
        url1Title: info?.url1Title || "",
        url1: info?.url1 || "",
        url2Title: info?.url2Title || "",
        url2: info?.url2 || "",
      });
    }
  }, [isOpen, info]);

  const validateForm = (): boolean => {
    const errors: string[] = [];
    
    if (!formData.title.trim()) errors.push('Title is required');
    if (formData.page === 'aboutus') {
      if (!formData.text.trim()) errors.push('Text is required for About Us page');
    } else if (formData.page === 'membership') {
      if (!formData.sub) errors.push('Position is required for Membership page');
      if (formData.sub === 'top') {
        if (!formData.texts?.length || !formData.texts.some(text => text.trim())) {
          errors.push('At least one text entry is required for Top position');
        }
      } else {
        if (!formData.text.trim()) errors.push('Text is required for Bottom position');
      }
    }

    if (errors.length > 0) {
      console.error('Form validation errors:', errors);
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form data being submitted:', formData);
    
    if (!validateForm()) {
      console.error('Form validation failed');
      return;
    }
    
    if (!user) {
      console.error('No user found');
      return;
    }

    setIsSubmitting(true);

    try {
      const finalIcon = formData.icon === "none" ? "" : formData.icon;
      console.log('Processing with icon:', finalIcon);
      
      if (info) {
        // For updating existing info
        const updateData = formData.page === 'membership' 
          ? {
              title: formData.title,
              icon: finalIcon,
              text: formData.text,
              page: formData.page,
              sub: formData.sub,
              texts: formData.texts || [],
              url1Title: formData.url1Title || "",
              url1: formData.url1 || "",
              url2Title: formData.url2Title || "",
              url2: formData.url2 || ""
            }
          : {
              title: formData.title,
              icon: finalIcon,
              text: formData.text,
              page: formData.page
            };
        
        console.log('Updating existing info:', info.id, updateData);
        await updateInfo(info.id, updateData, user);
      } else {
        // For creating new info
        console.log('Creating new info');
        if (formData.page === 'membership' && formData.sub) {
          // For membership page
          await createInfo(
            formData.title,
            finalIcon,
            formData.text,
            'membership',
            user,
            formData.sub,
            formData.texts || [],
            formData.url1Title || "",
            formData.url1 || "",
            formData.url2Title || "",
            formData.url2 || ""
          );
        } else {
          // For about us page
          await createInfo(
            formData.title,
            finalIcon,
            formData.text,
            'aboutus',
            user
          );
        }
      }
      
      console.log('Operation successful');
      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <FormModal
        isOpen={isOpen}
        onClose={onClose}
        title={info ? "Edit Info" : "Create Info"}
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
              placeholder="Enter title"
            />
          </div>

          <div>
            <Label htmlFor="icon">Icon *</Label>
            <Select
              value={formData.icon}
              onValueChange={(value) => setFormData({ ...formData, icon: value })}
            >
              <SelectTrigger id="icon" className="h-8">
                <SelectValue placeholder="Select an icon" />
              </SelectTrigger>
              <SelectContent>
                {ICON_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="page">Page *</Label>
            <Select
              value={formData.page}
              onValueChange={(value: 'aboutus' | 'membership') => {
                setFormData({ 
                  ...formData, 
                  page: value,
                  sub: value === 'aboutus' ? undefined : (formData.sub || 'top')
                });
              }}
            >
              <SelectTrigger id="page" className="h-8">
                <SelectValue placeholder="Select a page" />
              </SelectTrigger>
              <SelectContent>
                {PAGE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {formData.page === 'membership' && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="sub">Position *</Label>
                <Select
                  value={formData.sub}
                  onValueChange={(value: 'top' | 'bottom') => {
                    setFormData({ ...formData, sub: value });
                    setShowAdditionalFields(true);
                  }}
                >
                  <SelectTrigger id="sub" className="h-8">
                    <SelectValue placeholder="Select position" />
                  </SelectTrigger>
                  <SelectContent>
                    {SUB_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {formData.sub && (
                <Button
                  type="button"
                  onClick={() => setShowAdditionalFields(true)}
                  className="w-full text-white"
                >
                  Edit Additional Fields
                </Button>
              )}
            </div>
          )}

          {(formData.page === 'aboutus' || !formData.sub) && (
            <div>
              <Label htmlFor="text">Text *</Label>
              <Textarea
                id="text"
                value={formData.text}
                onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                required
                className="min-h-[100px]"
                placeholder="Enter text content"
              />
            </div>
          )}
        </div>
      </FormModal>

      <AdditionalFieldsModal
        isOpen={showAdditionalFields}
        onClose={() => setShowAdditionalFields(false)}
        formData={formData}
        setFormData={setFormData}
      />
    </>
  );
} 