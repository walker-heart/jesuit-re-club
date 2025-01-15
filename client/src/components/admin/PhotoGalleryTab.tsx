import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Image as ImageIcon, ArrowUp, ArrowDown, Trash2, Edit2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { listFiles, type StorageFile } from "@/lib/firebase/storage";
import { 
  getGalleryImages, 
  addGalleryImage, 
  updateGalleryImage, 
  deleteGalleryImage, 
  updateGalleryOrder,
  type GalleryImage 
} from "@/lib/firebase/gallery";

export function PhotoGalleryTab() {
  const [loading, setLoading] = useState(true);
  const [mainFolderFiles, setMainFolderFiles] = useState<StorageFile[]>([]);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [newImageTitle, setNewImageTitle] = useState('');
  const [selectedFileUrl, setSelectedFileUrl] = useState('');
  const { toast } = useToast();

  // Load gallery images and main folder files
  useEffect(() => {
    loadGalleryData();
  }, []);

  const loadGalleryData = async () => {
    try {
      setLoading(true);
      const [images, files] = await Promise.all([
        getGalleryImages(),
        listFiles('all/main')
      ]);
      
      setGalleryImages(images);
      setMainFolderFiles(
        files.filter(file => file.name.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/))
      );
    } catch (error) {
      console.error('Error loading gallery data:', error);
      toast({
        title: "Error",
        description: "Failed to load gallery data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddImage = async () => {
    if (!selectedFileUrl || !newImageTitle.trim()) return;

    try {
      setLoading(true);
      const newImage = await addGalleryImage({
        title: newImageTitle.trim(),
        imageUrl: selectedFileUrl,
        order: galleryImages.length
      });

      setGalleryImages([...galleryImages, newImage]);
      setIsAddModalOpen(false);
      setNewImageTitle('');
      setSelectedFileUrl('');
      toast({
        title: "Success",
        description: "Image added to gallery"
      });
    } catch (error) {
      console.error('Error adding image:', error);
      toast({
        title: "Error",
        description: "Failed to add image",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditImage = async () => {
    if (!selectedImage || !newImageTitle.trim()) return;

    try {
      setLoading(true);
      const updatedImage = {
        ...selectedImage,
        title: newImageTitle.trim()
      };
      
      await updateGalleryImage(updatedImage);
      
      setGalleryImages(images => 
        images.map(img => img.id === selectedImage.id ? updatedImage : img)
      );
      
      setIsEditModalOpen(false);
      setSelectedImage(null);
      setNewImageTitle('');
      toast({
        title: "Success",
        description: "Image updated successfully"
      });
    } catch (error) {
      console.error('Error updating image:', error);
      toast({
        title: "Error",
        description: "Failed to update image",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!confirm('Are you sure you want to remove this image from the gallery?')) return;

    try {
      setLoading(true);
      await deleteGalleryImage(imageId);
      
      const updatedImages = galleryImages
        .filter(img => img.id !== imageId)
        .map((img, index) => ({ ...img, order: index }));
      
      await updateGalleryOrder(updatedImages);
      setGalleryImages(updatedImages);
      
      toast({
        title: "Success",
        description: "Image removed from gallery"
      });
    } catch (error) {
      console.error('Error deleting image:', error);
      toast({
        title: "Error",
        description: "Failed to delete image",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMoveImage = async (imageId: string, direction: 'up' | 'down') => {
    const currentIndex = galleryImages.findIndex(img => img.id === imageId);
    if (
      (direction === 'up' && currentIndex === 0) ||
      (direction === 'down' && currentIndex === galleryImages.length - 1)
    ) return;

    try {
      setLoading(true);
      const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      const updatedImages = [...galleryImages];
      const [movedImage] = updatedImages.splice(currentIndex, 1);
      updatedImages.splice(newIndex, 0, movedImage);

      // Update order numbers
      const reorderedImages = updatedImages.map((img, index) => ({
        ...img,
        order: index
      }));

      await updateGalleryOrder(reorderedImages);
      setGalleryImages(reorderedImages);
    } catch (error) {
      console.error('Error reordering images:', error);
      toast({
        title: "Error",
        description: "Failed to reorder images",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-2xl font-bold">Photo Gallery</CardTitle>
        <Button onClick={() => setIsAddModalOpen(true)} className="bg-[#003c71] hover:bg-[#002855] text-white">
          <Plus className="h-4 w-4 mr-2" />
          Add Image
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : galleryImages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No images in the gallery. Click "Add Image" to get started.
            </div>
          ) : (
            <div className="space-y-4">
              {galleryImages.map((image, index) => (
                <Card key={image.id} className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="h-20 w-20 relative rounded-md overflow-hidden bg-muted">
                      <img
                        src={image.imageUrl}
                        alt={image.title}
                        className="object-cover w-full h-full"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{image.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        Order: {image.order + 1}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleMoveImage(image.id, 'up')}
                        disabled={index === 0}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleMoveImage(image.id, 'down')}
                        disabled={index === galleryImages.length - 1}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          setSelectedImage(image);
                          setNewImageTitle(image.title);
                          setIsEditModalOpen(true);
                        }}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDeleteImage(image.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Add Image Modal */}
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Gallery Image</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  placeholder="Enter image title"
                  value={newImageTitle}
                  onChange={(e) => setNewImageTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Select Image</Label>
                <div className="grid grid-cols-3 gap-2 max-h-[300px] overflow-y-auto p-2 border rounded-md">
                  {mainFolderFiles.map((file) => (
                    <div
                      key={file.path}
                      className={`relative aspect-square rounded-md overflow-hidden cursor-pointer border-2 ${
                        selectedFileUrl === file.downloadUrl ? 'border-primary' : 'border-transparent'
                      }`}
                      onClick={() => setSelectedFileUrl(file.downloadUrl)}
                    >
                      <img
                        src={file.downloadUrl}
                        alt={file.name}
                        className="object-cover w-full h-full"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleAddImage}
                  disabled={!selectedFileUrl || !newImageTitle.trim()}
                  className="bg-[#003c71] hover:bg-[#002855] text-white"
                >
                  Add to Gallery
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Image Modal */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Gallery Image</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  placeholder="Enter image title"
                  value={newImageTitle}
                  onChange={(e) => setNewImageTitle(e.target.value)}
                />
              </div>

              {selectedImage && (
                <div className="relative aspect-video rounded-md overflow-hidden bg-muted">
                  <img
                    src={selectedImage.imageUrl}
                    alt={selectedImage.title}
                    className="object-cover w-full h-full"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleEditImage}
                  disabled={!newImageTitle.trim()}
                  className="bg-[#003c71] hover:bg-[#002855] text-white"
                >
                  Save Changes
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
} 