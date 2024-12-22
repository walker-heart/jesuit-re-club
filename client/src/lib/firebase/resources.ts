import { collection, addDoc, getDocs, deleteDoc, doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from './firebase-config';
import { type FirebaseResource } from './types';

export type { FirebaseResource };

// Define interfaces for type safety
interface UserData {
  firstName?: string;
  lastName?: string;
  role?: string;
}

// Helper function to fetch user data
const getUserData = async (userId: string): Promise<UserData | null> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) return null;
    return userDoc.data() as UserData;
  } catch (error) {
    console.error('Error fetching user data:', error);
    return null;
  }
};

// Helper function to format creator name
const formatCreatorName = (userData: UserData | null): string => {
  if (!userData) return 'Unknown User';
  const { firstName, lastName } = userData;
  if (firstName && lastName) {
    return `${firstName} ${lastName}`;
  }
  return 'Unknown User';
};

export const createResource = async (resourceData: Omit<FirebaseResource, 'id'>): Promise<FirebaseResource> => {
  try {
    if (!auth.currentUser) {
      throw new Error('Authentication required to create resource');
    }

    const currentUserId = auth.currentUser.uid;
    const userData = await getUserData(currentUserId);

    // Create new resource
    const newResource = {
      ...resourceData,
      userId: currentUserId,
      userCreated: currentUserId,
      creatorName: formatCreatorName(userData),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      updatedBy: currentUserId
    };

    const docRef = await addDoc(collection(db, 'resources'), newResource);
    
    return {
      id: docRef.id,
      ...newResource
    };
  } catch (error) {
    console.error('Error creating resource:', error);
    throw error;
  }
};

export const updateResource = async (resourceData: FirebaseResource): Promise<FirebaseResource> => {
  try {
    if (!auth.currentUser) {
      throw new Error('Authentication required to update resource');
    }

    if (!resourceData.id) {
      throw new Error('Resource ID is required for update');
    }

    const currentUserId = auth.currentUser.uid;
    const userData = await getUserData(currentUserId);
    
    // Get existing resource
    const resourceRef = doc(db, 'resources', resourceData.id);
    const resourceDoc = await getDoc(resourceRef);
    
    if (!resourceDoc.exists()) {
      throw new Error('Resource not found');
    }

    const existingResource = resourceDoc.data() as FirebaseResource;

    // Check permissions
    const isAdmin = userData?.role === 'admin';
    if (!isAdmin && existingResource.userId !== currentUserId) {
      throw new Error('You do not have permission to update this resource');
    }

    // Update resource
    const updateData = {
      ...resourceData,
      updatedAt: new Date().toISOString(),
      updatedBy: currentUserId,
      creatorName: formatCreatorName(userData)
    };

    await updateDoc(resourceRef, updateData);
    
    return {
      ...existingResource,
      ...updateData,
      id: resourceData.id
    };
  } catch (error) {
    console.error('Error updating resource:', error);
    throw error;
  }
};

export const deleteResource = async (resourceId: string): Promise<void> => {
  try {
    if (!auth.currentUser) {
      throw new Error('Authentication required to delete resource');
    }

    const currentUserId = auth.currentUser.uid;
    const userData = await getUserData(currentUserId);
    
    // Get resource
    const resourceRef = doc(db, 'resources', resourceId);
    const resourceDoc = await getDoc(resourceRef);
    
    if (!resourceDoc.exists()) {
      throw new Error('Resource not found');
    }

    const resource = resourceDoc.data() as FirebaseResource;
    
    // Check permissions
    const isAdmin = userData?.role === 'admin';
    if (!isAdmin && resource.userId !== currentUserId) {
      throw new Error('You do not have permission to delete this resource');
    }

    await deleteDoc(resourceRef);
  } catch (error) {
    console.error('Error deleting resource:', error);
    throw error;
  }
};

export const fetchResources = async (): Promise<FirebaseResource[]> => {
  try {
    if (!auth.currentUser) {
      throw new Error('Authentication required to fetch resources');
    }

    const resourcesRef = collection(db, 'resources');
    const resourcesSnapshot = await getDocs(resourcesRef);
    const resources = resourcesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as FirebaseResource));

    // Update creator names
    const resourcesWithCreatorNames = await Promise.all(
      resources.map(async (resource) => {
        if (!resource.userCreated) {
          return { ...resource, creatorName: 'Unknown User' };
        }

        const userData = await getUserData(resource.userCreated);
        return {
          ...resource,
          creatorName: formatCreatorName(userData)
        };
      })
    );

    // Sort by creation date, newest first
    return resourcesWithCreatorNames.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA;
    });
  } catch (error) {
    console.error('Error fetching resources:', error);
    throw error;
  }
};
