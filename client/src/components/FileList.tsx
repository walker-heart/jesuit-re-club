import { useState, useEffect, ChangeEvent } from 'react';
import { listFiles, deleteFile, renameFile, type StorageFile } from '@/lib/firebase/storage';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FileText, File, Pencil, Trash2, Download } from 'lucide-react';

export default function FileList() {
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<StorageFile | null>(null);
  const [newFileName, setNewFileName] = useState('');
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    try {
      setLoading(true);
      setError(null);
      const fileList = await listFiles();
      setFiles(fileList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (file: StorageFile) => {
    if (!confirm(`Are you sure you want to delete ${file.name}?`)) return;
    
    try {
      await deleteFile(file.path);
      await loadFiles(); // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete file');
    }
  };

  const handleRename = (file: StorageFile) => {
    setSelectedFile(file);
    // Set initial name without extension
    const nameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.'));
    setNewFileName(nameWithoutExt);
    setShowRenameModal(true);
  };

  const handleRenameSubmit = async () => {
    if (!selectedFile || !newFileName.trim()) return;
    
    try {
      setError(null);
      // Get the original file extension
      const originalExt = selectedFile.name.split('.').pop() || '';
      
      // Remove any extension from the new name if present
      let cleanNewName = newFileName;
      if (cleanNewName.includes('.')) {
        cleanNewName = cleanNewName.substring(0, cleanNewName.lastIndexOf('.'));
      }
      
      // Add back the original extension
      const finalName = `${cleanNewName}.${originalExt}`;

      await renameFile(selectedFile.path, finalName);
      setShowRenameModal(false);
      await loadFiles(); // Refresh the list
    } catch (err) {
      console.error('Error renaming file:', err);
      setError(err instanceof Error ? err.message : 'Failed to rename file');
    }
  };

  const handlePreview = (file: StorageFile) => {
    setSelectedFile(file);
    setShowPreviewModal(true);
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    return `${size.toFixed(2)} ${units[unitIndex]}`;
  };

  const renderPreview = (file: StorageFile) => {
    if (file.contentType?.startsWith('image/')) {
      return (
        <img 
          src={file.downloadUrl} 
          alt={file.name}
          className="max-h-[400px] object-contain mx-auto rounded-lg"
        />
      );
    } else if (file.contentType?.startsWith('video/')) {
      return (
        <video 
          src={file.downloadUrl} 
          controls
          className="max-h-[400px] w-full"
        >
          Your browser does not support the video tag.
        </video>
      );
    } else if (file.contentType?.startsWith('audio/')) {
      return (
        <audio 
          src={file.downloadUrl} 
          controls
          className="w-full"
        >
          Your browser does not support the audio tag.
        </audio>
      );
    } else if (file.contentType?.includes('pdf')) {
      return (
        <iframe
          src={file.downloadUrl}
          className="w-full h-[400px] rounded-lg"
          title={file.name}
        />
      );
    } else {
      return (
        <div className="flex flex-col items-center justify-center p-8">
          <File className="w-20 h-20 text-gray-400" />
          <p className="mt-4 text-gray-500">Preview not available</p>
        </div>
      );
    }
  };

  if (loading) return <div className="p-4">Loading files...</div>;
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Files</h2>
      
      <div className="rounded-lg border">
        <Button variant="outline" className="w-full justify-start p-6 text-lg font-normal">
          Choose File
          <span className="ml-2 text-muted-foreground">No file chosen</span>
        </Button>
      </div>

      <div className="space-y-2">
        {!files.length ? (
          <div className="p-4 text-center text-muted-foreground">No files uploaded yet.</div>
        ) : (
          files.map((file, index) => (
            <div key={file.name} className="relative">
              <Button
                variant="outline"
                onClick={() => handlePreview(file)}
                className="w-full h-auto p-4 justify-start bg-white hover:bg-[#003c71] hover:text-white transition-colors duration-200"
              >
                <div className="flex items-center gap-4">
                  {file.contentType?.startsWith('image/') ? (
                    <img 
                      src={file.downloadUrl} 
                      alt={file.name}
                      className="w-10 h-10 object-cover rounded"
                    />
                  ) : file.contentType === 'application/pdf' ? (
                    <FileText className="w-10 h-10" />
                  ) : (
                    <File className="w-10 h-10" />
                  )}
                  <div className="text-left">
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm opacity-70">Size: {formatFileSize(file.size)}</p>
                  </div>
                </div>
              </Button>
              
              <Button
                variant="outline"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-white hover:bg-[#b3a369] hover:text-white transition-colors duration-200"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(file.downloadUrl, '_blank');
                }}
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          ))
        )}
      </div>

      {/* Preview Modal */}
      <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl">{selectedFile?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedFile && (
              <>
                <div className="bg-gray-50 rounded-lg overflow-hidden">
                  {renderPreview(selectedFile)}
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-500">Size: {formatFileSize(selectedFile.size)}</p>
                  <p className="text-sm text-gray-500">Type: {selectedFile.contentType || 'Unknown'}</p>
                  <p className="text-sm text-gray-500">
                    Uploaded: {new Date(selectedFile.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handleRename(selectedFile)}
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Rename
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      setShowPreviewModal(false);
                      handleDelete(selectedFile);
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Existing Rename Modal */}
      <Dialog open={showRenameModal} onOpenChange={setShowRenameModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename File</DialogTitle>
          </DialogHeader>
          <div className="p-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">New File Name</label>
              <div className="flex items-center gap-1">
                <Input
                  type="text"
                  value={newFileName}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setNewFileName(e.target.value)}
                  placeholder="Enter new file name"
                  className="flex-1"
                />
                <span className="text-sm text-gray-500 px-2">
                  .{selectedFile?.name.split('.').pop()}
                </span>
              </div>
              <p className="text-xs text-gray-500">File extension cannot be changed</p>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button
                variant="outline"
                onClick={() => setShowRenameModal(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleRenameSubmit}
                disabled={!newFileName.trim()}
              >
                Rename
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 