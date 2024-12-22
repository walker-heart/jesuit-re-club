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

// Helper function to get creator name from user data
const getCreatorName = async (userId: string): Promise<string> => {
  try {
    if (!userId) return 'Unknown User';
    
    const snapshot = await getDoc(doc(db, 'users', userId));
    if (!snapshot.exists()) return 'Unknown User';
    
    const data = snapshot.data() as UserData;
    return data.firstName && data.lastName
      ? `${data.firstName} ${data.lastName}`
      : auth.currentUser?.email || 'Unknown User';
  } catch (error) {
    console.error('Error getting creator name:', error);
    return auth.currentUser?.email || 'Unknown User';
  }
};

export const createResource = async (resourceData: Omit<FirebaseResource, 'id'>): Promise<FirebaseResource> => {
  try {
    if (!auth.currentUser) {
      throw new Error('Authentication required to create resource');
    }

    const currentUserId = auth.currentUser.uid;
    const creatorName = await getCreatorName(currentUserId);

    const newResource = {
      ...resourceData,
      userId: currentUserId,
      userCreated: currentUserId,
      creatorName,
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
    const snapshot = await getDoc(doc(db, 'users', currentUserId));
    const userData = snapshot.exists() ? snapshot.data() as UserData : null;
    
    const resourceSnapshot = await getDoc(doc(db, 'resources', resourceData.id));
    
    if (!resourceSnapshot.exists()) {
      throw new Error('Resource not found');
    }

    const existingResource = resourceSnapshot.data() as FirebaseResource;

    // Check permissions
    const isAdmin = userData?.role === 'admin';
    if (!isAdmin && existingResource.userId !== currentUserId) {
      throw new Error('You do not have permission to update this resource');
    }

    const updateData = {
      ...resourceData,
      updatedAt: new Date().toISOString(),
      updatedBy: currentUserId,
      creatorName: await getCreatorName(resourceData.userCreated)
    };

    await updateDoc(doc(db, 'resources', resourceData.id), updateData);
    
    return {
      ...existingResource,
      ...updateData
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
    const snapshot = await getDoc(doc(db, 'users', currentUserId));
    const userData = snapshot.exists() ? snapshot.data() as UserData : null;
    
    const resourceSnapshot = await getDoc(doc(db, 'resources', resourceId));
    
    if (!resourceSnapshot.exists()) {
      throw new Error('Resource not found');
    }

    const resource = resourceSnapshot.data() as FirebaseResource;
    
    // Check permissions
    const isAdmin = userData?.role === 'admin';
    if (!isAdmin && resource.userId !== currentUserId) {
      throw new Error('You do not have permission to delete this resource');
    }

    await deleteDoc(doc(db, 'resources', resourceId));
  } catch (error) {
    console.error('Error deleting resource:', error);
    throw error;
  }
};

export const fetchResources = async (userOnly: boolean = false): Promise<FirebaseResource[]> => {
  try {
    if (!auth.currentUser) {
      throw new Error('Authentication required to fetch resources');
    }

    const resourcesSnapshot = await getDocs(collection(db, 'resources'));
    let resources = resourcesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as FirebaseResource));

    // Filter for user's resources if requested
    if (userOnly) {
      resources = resources.filter(resource => resource.userCreated === auth.currentUser?.uid);
    }

    // Sort by creation date, newest first
    return resources.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA;
    });
  } catch (error) {
    console.error('Error fetching resources:', error);
    throw error;
  }
};

export async function fetchUser(userId: string) {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      return userDoc.data();
    }
    return null;
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
}
