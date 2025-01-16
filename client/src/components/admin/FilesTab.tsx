import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, Trash2, Edit2, FileIcon, Image as ImageIcon, FolderIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { auth } from "@/lib/firebase/firebase-config";
import { uploadFile, deleteFile, listFiles, renameFile, type StorageFile } from "@/lib/firebase/storage";

// Helper function to determine if a file is an image
const isImageFile = (filename: string) => {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.heic', '.webp'];
  return imageExtensions.some(ext => filename.toLowerCase().endsWith(ext));
};

// Helper function to determine if a file is a PDF
const isPdfFile = (filename: string) => {
  return filename.toLowerCase().endsWith('.pdf');
};

// Helper function to format date
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Helper function to get file type display name
const getFileType = (filename: string, contentType?: string) => {
  if (isImageFile(filename)) return 'Image';
  if (isPdfFile(filename)) return 'PDF';
  if (contentType) return contentType.split('/')[1].toUpperCase();
  return 'File';
};

type FolderOption = 'main' | 'news' | 'other';

const FOLDER_OPTIONS: { value: FolderOption; label: string }[] = [
  { value: 'main', label: 'Main' },
  { value: 'news', label: 'News' },
  { value: 'other', label: 'Other' }
];

export function FilesTab() {
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<StorageFile | null>(null);
  const [newFileName, setNewFileName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUploadFiles, setSelectedUploadFiles] = useState<File[]>([]);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<FolderOption>('main');
  const [uploadPreviewUrls, setUploadPreviewUrls] = useState<string[]>([]);
  const [currentFolder, setCurrentFolder] = useState<FolderOption | '' | 'cropped'>('');
  const [currentPath, setCurrentPath] = useState<string>('');
  const { toast } = useToast();

  // Filter files based on search query only
  const filteredFiles = files.filter(file => 
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get files count for each folder (only actual files, not folders)
  const getFolderFileCount = async (folder: FolderOption) => {
    try {
      const folderFiles = await listFiles(`all/${folder}`);
      // Only count actual files, not folders, and exclude cropped files
      return folderFiles.filter(file => 
        !file.path.endsWith('/') && 
        !file.path.includes('/cropped/')
      ).length;
    } catch (error) {
      console.error(`Error counting files in ${folder}:`, error);
      return 0;
    }
  };

  // Track folder counts
  const [folderCounts, setFolderCounts] = useState<Record<FolderOption, number>>({
    main: 0,
    news: 0,
    other: 0
  });

  // Load folder counts
  useEffect(() => {
    const loadFolderCounts = async () => {
      const counts: Record<FolderOption, number> = {
        main: 0,
        news: 0,
        other: 0
      };

      for (const folder of FOLDER_OPTIONS) {
        counts[folder.value] = await getFolderFileCount(folder.value);
      }

      setFolderCounts(counts);
    };

    loadFolderCounts();
  }, [files]);

  useEffect(() => {
    if (currentFolder === 'cropped') {
      const userId = auth.currentUser?.uid;
      if (userId) {
        loadFiles(`all/news/${userId}/cropped`);
        setCurrentPath(`all/news/${userId}/cropped`);
      }
    } else if (currentFolder) {
      loadFiles(`all/${currentFolder}`);
      setCurrentPath(`all/${currentFolder}`);
    } else {
      loadFiles('all');
      setCurrentPath('all');
    }
  }, [currentFolder]);

  const loadFiles = async (path: string = '') => {
    try {
      setLoading(true);
      const filesList = await listFiles(path);
      
      // Filter out cropped images from the main news folder view
      if (currentFolder === 'news' && !path.includes('/cropped')) {
        setFiles(filesList.filter(file => !file.name.startsWith('cropped_')));
      } else {
        setFiles(filesList);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load files",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    // Create preview URLs for images
    const previewUrls = files.map(file => {
      if (isImageFile(file.name)) {
        return URL.createObjectURL(file);
      }
      return '';
    });

    setUploadPreviewUrls(previewUrls);
    setSelectedUploadFiles(files);
    setIsUploadModalOpen(true);
  };

  // Clean up preview URLs when modal closes
  useEffect(() => {
    if (!isUploadModalOpen && uploadPreviewUrls.length > 0) {
      uploadPreviewUrls.forEach(url => {
        if (url) URL.revokeObjectURL(url);
      });
      setUploadPreviewUrls([]);
    }
  }, [isUploadModalOpen]);

  // Handle file upload with folder
  const handleUpload = async () => {
    if (selectedUploadFiles.length === 0) return;

    try {
      setLoading(true);
      const folderPath = `all/${selectedFolder}/${auth.currentUser?.uid}`;
      
      // Upload all files in parallel
      await Promise.all(
        selectedUploadFiles.map(file => uploadFile(file, folderPath))
      );

      await loadFiles();
      setIsUploadModalOpen(false);
      setSelectedUploadFiles([]);
      toast({
        title: "Success",
        description: `${selectedUploadFiles.length} file${selectedUploadFiles.length === 1 ? '' : 's'} uploaded successfully`
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to upload files",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (file: StorageFile) => {
    if (!confirm('Are you sure you want to delete this file?')) return;

    try {
      setLoading(true);
      await deleteFile(file.path);
      await loadFiles();
      toast({
        title: "Success",
        description: "File deleted successfully"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete file",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRename = async () => {
    if (!selectedFile || !newFileName.trim()) return;

    try {
      setLoading(true);
      await renameFile(selectedFile.path, newFileName);
      await loadFiles();
      setIsRenameModalOpen(false);
      setSelectedFile(null);
      setNewFileName('');
      toast({
        title: "Success",
        description: "File renamed successfully"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to rename file",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const openRenameModal = (file: StorageFile) => {
    setSelectedFile(file);
    // Use the original name without timestamp prefix
    setNewFileName(file.name);
    setIsRenameModalOpen(true);
  };

  const handleFolderClick = (folder: FolderOption | 'cropped') => {
    setCurrentFolder(folder);
  };

  const handleBackClick = () => {
    if (currentFolder === 'cropped') {
      setCurrentFolder('news');
    } else {
      setCurrentFolder('');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Files</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 max-w-md">
              <Input
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Input
                type="file"
                onChange={handleFileSelect}
                className="max-w-[300px]"
                accept="image/*,.pdf,.heic"
                multiple
              />
            </div>
          </div>

          {/* Breadcrumb Navigation */}
          <div className="flex items-center gap-2 text-sm">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackClick}
              disabled={!currentFolder}
              className="hover:bg-muted"
            >
              <FolderIcon className="h-4 w-4 mr-2" />
              All Folders
            </Button>
            {currentFolder && (
              <>
                <span>/</span>
                <span className="font-medium">
                  {currentFolder === 'cropped' ? (
                    <>news / cropped</>
                  ) : (
                    currentFolder
                  )}
                </span>
              </>
            )}
          </div>

          {/* Folders View */}
          {!currentFolder && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {FOLDER_OPTIONS.map((folder) => (
                <Card 
                  key={folder.value}
                  className="p-4 cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02]"
                  onClick={() => handleFolderClick(folder.value)}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-lg">
                      <FolderIcon className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{folder.label}</h3>
                      <p className="text-sm text-muted-foreground">
                        {loading ? "Loading..." : `${folderCounts[folder.value]} files`}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Files Grid - Only show when in a folder */}
          {currentFolder && !loading && (
            <>
              {currentFolder === 'news' && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <Card 
                    className="p-4 cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02]"
                    onClick={() => handleFolderClick('cropped')}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-muted rounded-lg">
                        <FolderIcon className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Cropped</h3>
                        <p className="text-sm text-muted-foreground">
                          Cropped images folder
                        </p>
                      </div>
                    </div>
                  </Card>
                </div>
              )}

              {filteredFiles.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No files found in this folder
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredFiles.map((file) => (
                    <Card 
                      key={file.path} 
                      className="p-4 cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] relative group overflow-hidden"
                      onClick={() => {
                        setSelectedFile(file);
                        setIsPreviewModalOpen(true);
                      }}
                    >
                      <div className="flex flex-col space-y-2">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold truncate">{file.name}</h3>
                        </div>
                        {isImageFile(file.name) && (
                          <div className="relative h-32 w-full bg-muted rounded-md overflow-hidden">
                            <img
                              src={file.downloadUrl}
                              alt={file.name}
                              className="object-cover w-full h-full"
                            />
                          </div>
                        )}
                        <div className="flex flex-col space-y-1 text-sm text-gray-500">
                          <div className="flex items-center space-x-2">
                            <FileIcon className="h-4 w-4" />
                            <span>{getFileType(file.name, file.contentType)}</span>
                          </div>
                          <p className="text-xs">
                            Uploaded {formatDate(file.createdAt)}
                          </p>
                          {file.uploaderName && (
                            <p className="text-xs">
                              By {file.uploaderName}
                            </p>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}

          {currentFolder && loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          )}
        </div>

        {/* Preview Modal */}
        <Dialog open={isPreviewModalOpen} onOpenChange={setIsPreviewModalOpen}>
          <DialogContent className="sm:max-w-[800px] h-[85vh] flex flex-col p-0">
            <DialogHeader className="px-6 pt-6 pb-2">
              <DialogTitle className="text-xl flex items-center gap-2">
                {isImageFile(selectedFile?.name || '') ? (
                  <ImageIcon className="w-5 h-5" />
                ) : (
                  <FileIcon className="w-5 h-5" />
                )}
                {selectedFile?.name}
              </DialogTitle>
            </DialogHeader>
            
            <div className="flex-1 overflow-hidden px-6">
              {/* File Preview */}
              <div className="h-[calc(85vh-13rem)] rounded-lg overflow-hidden bg-muted">
                {selectedFile && isImageFile(selectedFile.name) && (
                  <img
                    src={selectedFile.downloadUrl}
                    alt={selectedFile.name}
                    className="w-full h-full object-contain"
                  />
                )}
                {selectedFile && isPdfFile(selectedFile.name) && (
                  <iframe
                    src={selectedFile.downloadUrl}
                    className="w-full h-full"
                    title={selectedFile.name}
                  />
                )}
              </div>
            </div>

            {/* File Info and Actions - Fixed at bottom */}
            <div className="border-t mt-2">
              <div className="px-6 py-4 bg-muted/50">
                <div className="grid grid-cols-3 gap-6 mb-4">
                  {/* File Details */}
                  <div>
                    <p className="text-sm font-medium mb-1">File Details</p>
                    <p className="text-sm text-muted-foreground">
                      Type: {selectedFile && getFileType(selectedFile.name, selectedFile.contentType)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Size: {selectedFile && selectedFile.size ? (selectedFile.size / 1024).toFixed(2) : 0} KB
                    </p>
                  </div>
                  
                  {/* Upload Info */}
                  <div>
                    <p className="text-sm font-medium mb-1">Upload Information</p>
                    <p className="text-sm text-muted-foreground">
                      Date: {selectedFile && formatDate(selectedFile.createdAt)}
                    </p>
                    {selectedFile?.uploaderName && (
                      <p className="text-sm text-muted-foreground">
                        By: {selectedFile.uploaderName}
                      </p>
                    )}
                  </div>

                  {/* Path */}
                  <div>
                    <p className="text-sm font-medium mb-1">Location</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {selectedFile?.path}
                    </p>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (selectedFile) {
                        setIsPreviewModalOpen(false);
                        openRenameModal(selectedFile);
                      }
                    }}
                  >
                    <Edit2 className="h-4 w-4 mr-1" />
                    Rename
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (selectedFile) {
                        handleDelete(selectedFile);
                        setIsPreviewModalOpen(false);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                  <a
                    href={selectedFile?.downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button size="sm" className="bg-[#003c71] hover:bg-[#002855] text-white">
                      Download
                    </Button>
                  </a>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Rename Modal */}
        <Dialog open={isRenameModalOpen} onOpenChange={setIsRenameModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rename File</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 p-4">
              <div className="space-y-2">
                <Label>New File Name</Label>
                <Input
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  placeholder="Enter new file name"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setIsRenameModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleRename} disabled={loading} className="bg-[#003c71] hover:bg-[#002855] text-white">
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Rename"
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Upload Modal */}
        <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Files</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Select Folder</Label>
                <Select value={selectedFolder} onValueChange={(value: FolderOption) => setSelectedFolder(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select folder" />
                  </SelectTrigger>
                  <SelectContent>
                    {FOLDER_OPTIONS.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedUploadFiles.length > 0 && (
                <div className="space-y-2">
                  <Label>Selected Files</Label>
                  <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto p-2 border rounded-md">
                    {selectedUploadFiles.map((file, index) => (
                      <div key={file.name} className="space-y-1">
                        {uploadPreviewUrls[index] ? (
                          <div className="relative aspect-video rounded-md overflow-hidden bg-muted">
                            <img
                              src={uploadPreviewUrls[index]}
                              alt={file.name}
                              className="object-cover w-full h-full"
                            />
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 p-2 border rounded-md">
                            <FileIcon className="h-4 w-4" />
                            <span className="text-sm truncate">{file.name}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsUploadModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleUpload}
                  disabled={selectedUploadFiles.length === 0 || loading}
                  className="bg-[#003c71] hover:bg-[#002855] text-white"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    `Upload ${selectedUploadFiles.length} File${selectedUploadFiles.length === 1 ? '' : 's'}`
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
} 