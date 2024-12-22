import { collection, addDoc, getDocs, query, where, deleteDoc, doc, updateDoc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase-config';
import { type FirebaseResource } from './types';

export type { FirebaseResource };

export const createResource = async (resourceData: Omit<FirebaseResource, 'id'>): Promise<FirebaseResource> => {
  try {
    if (!auth.currentUser) {
      throw new Error('Authentication required to create resource');
    }

    // Validate required fields
    const requiredFields = ['title', 'description', 'numberOfTexts', 'textFields'] as const;
    const missingFields = requiredFields.filter(field => !resourceData[field]);
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    const currentUserId = auth.currentUser.uid;
    if (!currentUserId) {
      throw new Error('User ID is required to create a resource');
    }

    // Get current user's data from Firestore
    const userDoc = await getDoc(doc(db, 'users', currentUserId));
    const userData = userDoc.data();

    // Format creator name
    let creatorName = 'Unknown User';
    if (userData?.firstName && userData?.lastName) {
      creatorName = `${userData.firstName} ${userData.lastName}`;
    } else if (userData?.firstName || userData?.lastName) {
      creatorName = `${userData.firstName || ''}${userData.lastName || ''}`.trim();
    }

    // Prepare the new resource
    const newResource = {
      ...resourceData,
      userId: currentUserId,
      userCreated: currentUserId,
      creatorName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      updatedBy: currentUserId
    };

    // Create the resource
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

    // Get the existing resource
    const resourceRef = doc(db, 'resources', resourceData.id);
    const resourceDoc = await getDoc(resourceRef);
    
    if (!resourceDoc.exists()) {
      throw new Error('Resource not found');
    }

    const existingResource = resourceDoc.data() as FirebaseResource;

    // Check if user has permission to update
    const userDoc = await getDoc(doc(db, 'users', currentUserId));
    const userData = userDoc.data();
    const isAdmin = userData?.role === 'admin';

    if (!isAdmin && existingResource.userId !== currentUserId) {
      throw new Error('You do not have permission to update this resource');
    }

    // Format creator name
    let creatorName = existingResource.creatorName || 'Unknown User';
    if (userData?.firstName || userData?.lastName) {
      creatorName = `${userData.firstName || ''} ${userData.lastName || ''}`.trim();
    }

    // Prepare update data
    const updateData = {
      ...resourceData,
      updatedAt: new Date().toISOString(),
      updatedBy: currentUserId,
      creatorName
    };

    // Update the resource
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
    const resourceRef = doc(db, 'resources', resourceId);
    const resourceDoc = await getDoc(resourceRef);
    
    if (!resourceDoc.exists()) {
      throw new Error('Resource not found');
    }

    const resource = resourceDoc.data() as FirebaseResource;
    
    // Check if user has permission to delete
    const userDoc = await getDoc(doc(db, 'users', currentUserId));
    const userData = userDoc.data();
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
    const resourcesRef = collection(db, 'resources');
    const resourcesSnapshot = await getDocs(resourcesRef);
    
    // Get all resources
    const resources = resourcesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as FirebaseResource));

    // Update creator names
    const resourcesWithCreatorNames = await Promise.all(
      resources.map(async (resource) => {
        try {
          if (!resource.userCreated) {
            return { ...resource, creatorName: 'Unknown User' };
          }

          const userDoc = await getDoc(doc(db, 'users', resource.userCreated));
          const userData = userDoc.data();

          let creatorName = 'Unknown User';
          if (userData?.firstName || userData?.lastName) {
            creatorName = `${userData.firstName || ''} ${userData.lastName || ''}`.trim();
          }

          return { ...resource, creatorName };
        } catch (error) {
          console.error('Error fetching creator data for resource:', resource.id, error);
          return { ...resource, creatorName: 'Unknown User' };
        }
      })
    );

    return resourcesWithCreatorNames;
  } catch (error) {
    console.error('Error fetching resources:', error);
    throw error;
  }
};
