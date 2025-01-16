import { useState, useEffect } from "react"
import { FormModal } from "./FormModal"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useNews } from "@/hooks/use-news"
import { auth, storage } from "@/lib/firebase/firebase-config"
import { listFiles, uploadFile } from "@/lib/firebase/storage"
import type { FirebaseNews } from "@/lib/firebase/types"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import 'cropperjs/dist/cropper.css';
import Cropper from 'react-cropper';
import { ref, getDownloadURL } from 'firebase/storage';
import path from 'path';

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
  const [croppedFiles, setCroppedFiles] = useState<{ name: string; path: string; downloadUrl: string }[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'main' | 'cropped'>('main');
  
  // Cropper states
  const [showCropper, setShowCropper] = useState(false);
  const [cropper, setCropper] = useState<Cropper>();
  const [previewUrl, setPreviewUrl] = useState<string>("");
  
  // Image selection dialog state
  const [showImageSelect, setShowImageSelect] = useState(false);

  // Add state for tracking selected image path
  const [selectedImagePath, setSelectedImagePath] = useState<string | null>(null);

  // Reset form when modal is opened/closed
  useEffect(() => {
    if (isOpen) {
      if (news) {
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

  // Cleanup preview URL when component unmounts
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const loadExistingFiles = async () => {
    setIsLoadingFiles(true);
    try {
      const [mainFiles, croppedFiles] = await Promise.all([
        listFiles('all/news'),
        listFiles(`all/news/${auth.currentUser?.uid}/cropped`)
      ]);
      
      // Filter main images to exclude any that have been cropped
      const mainImageFiles = mainFiles
        .filter(file => 
          (file.contentType?.startsWith('image/') || 
          file.name.match(/\.(jpg|jpeg|png|gif|webp)$/i)) &&
          !file.name.startsWith('cropped_')
        );
      
      // Filter cropped images
      const croppedImageFiles = croppedFiles
        .filter(file => 
          (file.contentType?.startsWith('image/') || 
          file.name.match(/\.(jpg|jpeg|png|gif|webp)$/i)) &&
          file.name.startsWith('cropped_')
        );
      
      setExistingFiles(mainImageFiles);
      setCroppedFiles(croppedImageFiles);
    } catch (error) {
      console.error('Error loading files:', error);
    } finally {
      setIsLoadingFiles(false);
    }
  };

  const handleImageSelect = async (downloadUrl: string, path: string) => {
    setSelectedImagePath(path); // Store the path of the selected image
    try {
      // Get a fresh download URL using the storage reference
      const storageRef = ref(storage, path);
      const freshUrl = await getDownloadURL(storageRef);
      
      // Create an image element to load the image
      const img = new Image();
      img.crossOrigin = "anonymous";
      
      // Create a promise to handle image loading
      const imageLoadPromise = new Promise((resolve, reject) => {
        img.onload = () => {
          // Create a canvas to draw the image
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          
          // Draw the image to canvas
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
          }
          ctx.drawImage(img, 0, 0);
          
          try {
            // Get data URL
            const dataUrl = canvas.toDataURL('image/jpeg');
            resolve(dataUrl);
          } catch (error) {
            reject(error);
          }
        };
        img.onerror = () => reject(new Error('Could not load image'));
      });

      // Load the image
      img.src = freshUrl;
      
      // Wait for the image to be processed and get the data URL
      const dataUrl = await imageLoadPromise;
      setPreviewUrl(dataUrl as string);
      setShowImageSelect(false);
      setShowCropper(true);
    } catch (error) {
      console.error('Error processing selected image:', error);
    }
  };

  const handleCropCancel = () => {
    setShowCropper(false);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl("");
    }
  };

  const handleCropComplete = async () => {
    if (!cropper) return;

    try {
      setIsSubmitting(true);
      
      // Get cropped canvas
      const croppedCanvas = cropper.getCroppedCanvas();
      
      // Convert canvas to blob
      const croppedBlob = await new Promise<Blob>((resolve) => {
        croppedCanvas.toBlob((blob) => {
          if (blob) resolve(blob);
        }, 'image/jpeg');
      });

      // Create File object for cropped image with metadata in the name
      const timestamp = Date.now();
      const croppedFile = new File([croppedBlob], `cropped_${timestamp}.jpg`, {
        type: 'image/jpeg',
      });

      // Upload cropped file
      const userId = auth.currentUser?.uid;
      if (!userId) throw new Error("User not authenticated");

      const croppedUpload = await uploadFile(croppedFile, `all/news/${userId}/cropped`);

      // Use the cropped version's URL for the news item
      setFormData(prev => ({
        ...prev,
        imageUrl: croppedUpload.downloadUrl
      }));

      // Cleanup and close cropper
      setShowCropper(false);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl("");
      }

      // Refresh the file list
      await loadExistingFiles();
    } catch (error) {
      console.error('Error processing image:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const validateForm = (): boolean => {
    if (!formData.title.trim()) return false;
    if (!formData.content.trim()) return false;
    if (!formData.imageUrl) return false;
    if (!formData.userId) return false;
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
    <>
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
            <div className="mt-2 space-y-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowImageSelect(true)}
                className="w-full"
              >
                {formData.imageUrl ? "Change Image" : "Select Image"}
              </Button>
              {formData.imageUrl && (
                <div className="aspect-[3/1] w-full relative rounded-lg overflow-hidden">
                  <img
                    src={formData.imageUrl}
                    alt="Selected"
                    className="object-cover w-full h-full"
                  />
                </div>
              )}
            </div>
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

      {/* Image Selection Dialog */}
      <Dialog open={showImageSelect} onOpenChange={setShowImageSelect}>
        <DialogContent className="max-w-[800px] w-full">
          <DialogHeader>
            <DialogTitle>Select an Image</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex space-x-2 border-b">
              <button
                className={`px-4 py-2 ${
                  selectedTab === 'main'
                    ? 'border-b-2 border-primary font-semibold'
                    : 'text-muted-foreground'
                }`}
                onClick={() => setSelectedTab('main')}
              >
                Main Images
              </button>
              <button
                className={`px-4 py-2 ${
                  selectedTab === 'cropped'
                    ? 'border-b-2 border-primary font-semibold'
                    : 'text-muted-foreground'
                }`}
                onClick={() => setSelectedTab('cropped')}
              >
                Cropped Images
              </button>
            </div>
            
            {isLoadingFiles ? (
              <div className="text-sm text-muted-foreground">Loading images...</div>
            ) : selectedTab === 'main' ? (
              existingFiles.length === 0 ? (
                <div className="text-sm text-muted-foreground">No main images found</div>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {existingFiles.map((file) => (
                    <div
                      key={file.path}
                      className="relative aspect-square cursor-pointer rounded-lg overflow-hidden hover:opacity-80 transition-opacity"
                      onClick={() => handleImageSelect(file.downloadUrl, file.path)}
                    >
                      <img
                        src={file.downloadUrl}
                        alt={file.name}
                        className="object-cover w-full h-full"
                        crossOrigin="anonymous"
                      />
                    </div>
                  ))}
                </div>
              )
            ) : (
              croppedFiles.length === 0 ? (
                <div className="text-sm text-muted-foreground">No cropped images found</div>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {croppedFiles.map((file) => (
                    <div
                      key={file.path}
                      className="relative aspect-square cursor-pointer rounded-lg overflow-hidden hover:opacity-80 transition-opacity"
                      onClick={() => handleImageSelect(file.downloadUrl, file.path)}
                    >
                      <img
                        src={file.downloadUrl}
                        alt={file.name}
                        className="object-cover w-full h-full"
                        crossOrigin="anonymous"
                      />
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Cropper Dialog */}
      <Dialog open={showCropper} onOpenChange={setShowCropper}>
        <DialogContent className="max-w-[1400px] w-[90vw] p-4">
          <DialogHeader className="pb-4">
            <DialogTitle>Crop Image</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col space-y-4">
            <div className="relative w-full h-[600px]">
              {previewUrl && (
                <Cropper
                  src={previewUrl}
                  style={{ height: '100%', width: '100%' }}
                  initialAspectRatio={3 / 1}
                  aspectRatio={3 / 1}
                  guides={true}
                  onInitialized={(instance) => setCropper(instance)}
                  crossOrigin="anonymous"
                  viewMode={1}
                  background={false}
                  autoCropArea={1}
                  dragMode="move"
                  modal={false}
                  highlight={false}
                  responsive={true}
                  restore={true}
                  checkOrientation={true}
                  center={true}
                />
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleCropCancel}>
                Cancel
              </Button>
              <Button onClick={handleCropComplete} disabled={isSubmitting} className="bg-[#003c71] hover:bg-[#002855] text-white">
                {isSubmitting ? "Processing..." : "Crop & Upload"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
} 