import { collection, addDoc, getDocs, query, where, deleteDoc, doc, updateDoc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase-config';

import { type FirebaseResource } from './types';

export type { FirebaseResource };

export const createResource = async (resourceData: Omit<FirebaseResource, 'id' | 'userCreated' | 'createdAt'>): Promise<FirebaseResource> => {
  try {
    if (!auth.currentUser) {
      throw new Error('Authentication required to create resource');
    }

    // Validate required fields
    const requiredFields = ['title', 'description', 'numberOfTexts', 'textFields'] as const;
    const missingFields = requiredFields.filter(field => !resourceData[field as keyof typeof resourceData]);
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    if (!auth.currentUser?.uid) {
      throw new Error('User ID is required to create a resource');
    }

    // Get current user's data from Firestore
    const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
    const userData = userDoc.data();

    const newResource = {
      ...resourceData,
      userId: auth.currentUser.uid,
      createdAt: new Date().toISOString(),
      userCreated: auth.currentUser.email || 'Unknown user',
      creatorName: userData ? 
        `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || 'Unknown User' 
        : 'Unknown User',
      updatedAt: new Date().toISOString(),
      updatedBy: auth.currentUser.uid
    };

    console.log('Creating new resource:', newResource);
    const docRef = await addDoc(collection(db, 'resources'), newResource);
    
    const createdResource = {
      id: docRef.id,
      ...newResource
    } as FirebaseResource;
    
    console.log('Resource created successfully:', createdResource);
    return createdResource;
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

    // Get the existing resource to check permissions
    const resourceRef = doc(db, 'resources', resourceData.id);
    const resourceDoc = await getDoc(resourceRef);
    
    if (!resourceDoc.exists()) {
      throw new Error('Resource not found');
    }

    const existingResource = resourceDoc.data() as FirebaseResource;
    const currentUserIdentifier = auth.currentUser.email || auth.currentUser.displayName || 'Unknown user';

    // Check if user is the creator of the resource
    if (existingResource.userCreated !== currentUserIdentifier) {
      throw new Error('You do not have permission to update this resource');
    }

    // Validate and clean input data
    const title = resourceData.title?.trim();
    const description = resourceData.description?.trim();
    const textFields = resourceData.textFields?.map(field => field?.trim()).filter(Boolean);
    const numberOfTexts = resourceData.numberOfTexts;

    // Validate all required fields
    if (!title || !description || !textFields?.length || typeof numberOfTexts !== 'number') {
      throw new Error('All fields are required and cannot be empty');
    }

    // Prepare update payload
    const updateData = {
      title,
      description,
      numberOfTexts,
      textFields,
      updatedAt: new Date().toISOString(),
      updatedBy: currentUserIdentifier
    };

    console.log('Updating resource with data:', updateData);
    
    // Update document in Firestore
    await updateDoc(resourceRef, updateData);
    
    // Return updated resource with complete type information
    const updatedResource: FirebaseResource = {
      ...existingResource,
      ...updateData,
      id: resourceData.id
    };
    
    console.log('Resource updated successfully:', updatedResource);
    return updatedResource;
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

    const resourceRef = doc(db, 'resources', resourceId);
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
    
    return resourcesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as FirebaseResource));
  } catch (error) {
    console.error('Error fetching resources:', error);
    throw error;
  }
};