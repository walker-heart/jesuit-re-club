import { ref, uploadBytes, deleteObject, listAll, getDownloadURL, getMetadata, updateMetadata, type StorageReference, type UploadMetadata, StorageError } from 'firebase/storage';
import { auth, storage } from './firebase-config';

export interface StorageFile {
  name: string;
  path: string;
  downloadUrl: string;
  contentType?: string;
  size?: number;
  createdAt: string;
  updatedAt: string;
  uploadedBy?: string;
  uploaderName?: string;
}

// Create a new file
export async function uploadFile(file: File, path: string = ''): Promise<StorageFile> {
  if (!auth.currentUser) {
    throw new Error('Authentication required to upload files');
  }

  try {
    // Create file reference
    const timestamp = Date.now();
    const safeName = encodeURIComponent(file.name.replace(/[^a-zA-Z0-9.-]/g, '_'));
    const filePath = path 
      ? `${path}/${timestamp}_${safeName}` 
      : `files/${timestamp}_${safeName}`;
    
    const fileRef = ref(storage, filePath);
    
    // Create file metadata
    const metadata: UploadMetadata = {
      contentType: file.type,
      customMetadata: {
        uploadedBy: auth.currentUser.uid,
        uploaderName: auth.currentUser.displayName || 'Unknown User',
        uploadedAt: new Date().toISOString(),
        originalName: file.name
      }
    };
    
    console.log('Uploading file:', {
      filePath,
      fullPath: fileRef.fullPath,
      bucket: fileRef.bucket,
      name: fileRef.name,
      userId: auth.currentUser.uid
    });
    
    // Upload file
    const snapshot = await uploadBytes(fileRef, file, metadata);
    console.log('Upload successful:', snapshot);
    
    const downloadUrl = await getDownloadURL(snapshot.ref);
    console.log('Download URL:', downloadUrl);

    return {
      name: file.name,
      path: filePath,
      downloadUrl,
      contentType: file.type,
      size: file.size,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  } catch (error: unknown) {
    console.error('Error uploading file:', error);
    if (error instanceof Error) {
      const storageError = error as StorageError;
      console.error('Storage error details:', {
        code: storageError.code,
        message: storageError.message,
        serverResponse: (storageError as any).serverResponse,
        fullError: storageError
      });
      throw new Error(`Failed to upload file: ${storageError.message}`);
    }
    throw new Error('An unknown error occurred while uploading the file');
  }
}

// List all files recursively
export async function listFiles(path: string = ''): Promise<StorageFile[]> {
  if (!auth.currentUser) {
    throw new Error('Authentication required to list files');
  }

  async function listAllFiles(ref: StorageReference): Promise<StorageFile[]> {
    const result: StorageFile[] = [];
    
    try {
      const res = await listAll(ref);
      
      // Process all files in current directory
      const filePromises = res.items.map(async (itemRef) => {
        try {
          const [metadata, downloadUrl] = await Promise.all([
            getMetadata(itemRef),
            getDownloadURL(itemRef)
          ]);
          
          const file: StorageFile = {
            name: metadata.customMetadata?.originalName || itemRef.name.split('_').slice(1).join('_'),
            path: itemRef.fullPath,
            downloadUrl,
            contentType: metadata.contentType || undefined,
            size: metadata.size || undefined,
            createdAt: metadata.timeCreated,
            updatedAt: metadata.updated,
            uploadedBy: metadata.customMetadata?.uploadedBy,
            uploaderName: metadata.customMetadata?.uploaderName
          };
          return file;
        } catch (error) {
          console.error(`Error processing file ${itemRef.name}:`, error);
          return null;
        }
      });

      // Process all subdirectories recursively
      const folderPromises = res.prefixes.map(prefix => listAllFiles(prefix));
      
      // Wait for all files and subdirectories to be processed
      const [files, subFolders] = await Promise.all([
        Promise.all(filePromises),
        Promise.all(folderPromises)
      ]);
      
      // Add files from current directory
      const validFiles = files.filter((file): file is StorageFile => file !== null);
      result.push(...validFiles);
      
      // Add files from subdirectories
      subFolders.forEach(folderFiles => {
        result.push(...folderFiles);
      });
      
    } catch (error) {
      console.error('Error listing files:', error);
    }
    
    return result;
  }

  try {
    const listPath = path || 'files';
    const listRef = ref(storage, listPath);
    
    console.log('Listing files from:', {
      path: listPath,
      userId: auth.currentUser.uid
    });
    
    return await listAllFiles(listRef);
    
  } catch (error: unknown) {
    console.error('Error in listFiles:', error);
    if (error instanceof Error) {
      const storageError = error as StorageError;
      console.error('Storage error details:', {
        code: storageError.code,
        message: storageError.message,
        serverResponse: (storageError as any).serverResponse,
        fullError: storageError
      });
      throw new Error(`Failed to list files: ${storageError.message}`);
    }
    throw new Error('An unknown error occurred while listing files');
  }
}

// Delete a file
export async function deleteFile(filePath: string): Promise<void> {
  if (!auth.currentUser) {
    throw new Error('Authentication required to delete files');
  }

  try {
    // Ensure the file path is under the correct directory structure
    const userFolder = `/${auth.currentUser.uid}`;
    if (!filePath.includes(userFolder)) {
      throw new Error('Cannot delete files outside your directory');
    }

    console.log('Deleting file:', {
      filePath,
      userId: auth.currentUser.uid
    });

    const fileRef = ref(storage, filePath);
    await deleteObject(fileRef);
    
    console.log('File deleted successfully');
  } catch (error: unknown) {
    console.error('Error deleting file:', error);
    if (error instanceof Error) {
      const storageError = error as StorageError;
      console.error('Storage error details:', {
        code: storageError.code,
        message: storageError.message,
        serverResponse: (storageError as any).serverResponse,
        fullError: storageError
      });
      throw new Error(`Failed to delete file: ${storageError.message}`);
    }
    throw new Error('An unknown error occurred while deleting the file');
  }
}

// Rename a file (metadata update only)
export async function renameFile(oldPath: string, newName: string): Promise<StorageFile> {
  if (!auth.currentUser) {
    throw new Error('Authentication required to rename files');
  }

  try {
    // Get the file reference
    const fileRef = ref(storage, oldPath);
    
    // Get current metadata
    const metadata = await getMetadata(fileRef);
    
    // Keep the timestamp prefix from the original path
    const timestamp = oldPath.split('/').pop()?.split('_')[0];
    const safeName = encodeURIComponent(newName.replace(/[^a-zA-Z0-9.-]/g, '_'));
    const newStorageName = `${timestamp}_${safeName}`;
    
    // Update metadata with new name but keep the timestamp in storage
    const updatedMetadata = await updateMetadata(fileRef, {
      customMetadata: {
        ...metadata.customMetadata,
        originalName: newName
      }
    });

    // Get the download URL
    const downloadUrl = await getDownloadURL(fileRef);

    return {
      name: newName,
      path: oldPath,
      downloadUrl,
      contentType: updatedMetadata.contentType,
      size: updatedMetadata.size,
      createdAt: updatedMetadata.timeCreated,
      updatedAt: updatedMetadata.updated,
      uploadedBy: updatedMetadata.customMetadata?.uploadedBy,
      uploaderName: updatedMetadata.customMetadata?.uploaderName
    };
  } catch (error: unknown) {
    console.error('Error in rename operation:', error);
    if (error instanceof Error) {
      const storageError = error as StorageError;
      console.error('Storage error details:', {
        code: storageError.code,
        message: storageError.message,
        serverResponse: (storageError as any).serverResponse,
        fullError: storageError
      });
      throw new Error(`Failed to rename file: ${storageError.message}`);
    }
    throw new Error('An unknown error occurred while renaming the file');
  }
} 