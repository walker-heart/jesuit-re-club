import { collection, addDoc, getDocs, deleteDoc, doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from './firebase-config';
import { type FirebaseResource, type UserInfo } from './types';

export type { FirebaseResource };

// Helper function to get user info
const getUserInfo = async (userId: string): Promise<UserInfo> => {
  try {
    if (!userId) {
      return {
        firstName: '',
        lastName: '',
        email: 'Unknown User'
      };
    }
    
    const snapshot = await getDoc(doc(db, 'users', userId));
    if (!snapshot.exists()) {
      return {
        firstName: '',
        lastName: '',
        email: 'Unknown User'
      };
    }
    
    const data = snapshot.data();
    return {
      firstName: data.firstName || '',
      lastName: data.lastName || '',
      email: data.email || 'Unknown User'
    };
  } catch (error) {
    console.error('Error getting user info:', error);
    return {
      firstName: '',
      lastName: '',
      email: 'Unknown User'
    };
  }
};

export const createResource = async (resourceData: Omit<FirebaseResource, 'id' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>): Promise<FirebaseResource> => {
  try {
    if (!auth.currentUser) {
      throw new Error('Authentication required to create resource');
    }

    const currentUserId = auth.currentUser.uid;
    const userInfo = await getUserInfo(currentUserId);

    const newResource = {
      ...resourceData,
      userId: currentUserId,
      createdBy: userInfo,
      createdAt: new Date().toISOString(),
      updatedBy: userInfo,
      updatedAt: new Date().toISOString()
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
    const userData = snapshot.exists() ? snapshot.data() : null;
    
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

    const userInfo = await getUserInfo(currentUserId);

    const updateData = {
      ...resourceData,
      updatedBy: userInfo,
      updatedAt: new Date().toISOString()
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
    const userData = snapshot.exists() ? snapshot.data() : null;
    
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
    const resourcesSnapshot = await getDocs(collection(db, 'resources'));
    let resources = resourcesSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title || '',
        description: data.description || '',
        textFields: Array.isArray(data.textFields) ? data.textFields : [],
        urls: Array.isArray(data.urls) ? data.urls : [],
        userId: data.userId || '',
        createdBy: data.createdBy || { firstName: '', lastName: '', email: '' },
        createdAt: data.createdAt || new Date().toISOString(),
        updatedBy: data.updatedBy || { firstName: '', lastName: '', email: '' },
        updatedAt: data.updatedAt || new Date().toISOString()
      };
    });

    // Filter for user's resources if requested and user is authenticated
    if (userOnly && auth.currentUser) {
      resources = resources.filter(resource => resource.userId === auth.currentUser?.uid);
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
