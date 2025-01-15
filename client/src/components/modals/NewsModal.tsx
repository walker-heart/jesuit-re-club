import { useState, useEffect } from "react"
import { FormModal } from "./FormModal"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useNews } from "@/hooks/use-news"
import { auth } from "@/lib/firebase/firebase-config"
import { listFiles } from "@/lib/firebase/storage"
import type { FirebaseNews } from "@/lib/firebase/types"

interface NewsModalProps {
  isOpen: boolean;
  onClose: () => void;
  news?: FirebaseNews | null;
  onSuccess?: () => void;
}

export function NewsModal({ isOpen, onClose, news, onSuccess }: NewsModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createNews, updateNews } = useNews();
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    imageUrl: "",
    tags: [] as string[],
    isPublished: false,
    userId: auth.currentUser?.uid || "",
    date: new Date().toISOString()
  });

  const [existingFiles, setExistingFiles] = useState<{ name: string; path: string; downloadUrl: string }[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);

  // Reset form when modal is opened/closed
  useEffect(() => {
    if (isOpen) {
      if (news) {
        // Editing existing news
        setFormData({
          title: news.title || "",
          content: news.content || "",
          imageUrl: news.imageUrl || "",
          tags: news.tags || [],
          isPublished: news.isPublished || false,
          userId: news.userId || auth.currentUser?.uid || "",
          date: news.date || new Date().toISOString()
        });
      } else {
        // Creating new news
        setFormData({
          title: "",
          content: "",
          imageUrl: "",
          tags: [],
          isPublished: false,
          userId: auth.currentUser?.uid || "",
          date: new Date().toISOString()
        });
      }
      loadExistingFiles();
    }
  }, [isOpen, news]);

  const loadExistingFiles = async () => {
    setIsLoadingFiles(true);
    try {
      const files = await listFiles('all/news');
      const imageFiles = files.filter(file => 
        file.contentType?.startsWith('image/') || 
        file.name.match(/\.(jpg|jpeg|png|gif|webp)$/i)
      );
      setExistingFiles(imageFiles);
    } catch (error) {
      console.error('Error loading files:', error);
    } finally {
      setIsLoadingFiles(false);
    }
  };

  const handleImageSelect = (downloadUrl: string) => {
    setFormData(prev => ({
      ...prev,
      imageUrl: prev.imageUrl === downloadUrl ? "" : downloadUrl
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.title.trim()) {
      return false;
    }
    if (!formData.content.trim()) {
      return false;
    }
    if (!formData.imageUrl) {
      return false;
    }
    if (!formData.userId) {
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    try {
      if (news?.id) {
        await updateNews(news.id, formData);
      } else {
        await createNews(formData);
      }
      onSuccess?.();
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title={news ? "Edit News" : "Create News"}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
    >
      <div className="space-y-3">
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
          <Label htmlFor="content">Content *</Label>
          <Textarea
            id="content"
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            required
            className="min-h-[100px]"
          />
        </div>
        <div>
          <Label>Image *</Label>
          {isLoadingFiles ? (
            <div className="text-sm text-muted-foreground">Loading images...</div>
          ) : existingFiles.length === 0 ? (
            <div className="text-sm text-muted-foreground">No images found</div>
          ) : (
            <div className="grid grid-cols-4 gap-2 mt-2">
              {existingFiles.map((file) => (
                <div
                  key={file.path}
                  className={`relative aspect-square cursor-pointer rounded-lg overflow-hidden border-2 ${
                    formData.imageUrl === file.downloadUrl ? 'border-primary' : 'border-transparent'
                  }`}
                  onClick={() => handleImageSelect(file.downloadUrl)}
                >
                  <img
                    src={file.downloadUrl}
                    alt={file.name}
                    className="object-cover w-full h-full"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
        <div>
          <Label htmlFor="tags">Tags</Label>
          <Input
            id="tags"
            value={formData.tags.join(", ")}
            onChange={(e) => {
              const tagsArray = e.target.value
                .split(",")
                .map(tag => tag.trim())
                .filter(tag => tag.length > 0);
              setFormData({ ...formData, tags: tagsArray });
            }}
            placeholder="Enter tags separated by commas"
            className="h-8"
          />
        </div>
      </div>
    </FormModal>
  );
} 