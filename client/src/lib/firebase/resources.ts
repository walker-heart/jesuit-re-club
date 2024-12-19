import { collection, addDoc, getDocs, query, where, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { auth, db } from './firebase-config';

import { type FirebaseResource } from './types';

export type { FirebaseResource };

export const createResource = async (resourceData: Omit<FirebaseResource, 'id' | 'createdAt' | 'userCreated'>): Promise<FirebaseResource> => {
  try {
    if (!auth.currentUser) {
      throw new Error('Authentication required to create resource');
    }

    // Validate required fields
    const requiredFields = ['title', 'description', 'numberOfTexts', 'textFields'];
    const missingFields = requiredFields.filter(field => !resourceData[field]);
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    const newResource = {
      ...resourceData,
      createdAt: new Date().toISOString(),
      userCreated: auth.currentUser?.email || 'Unknown user',
      updatedAt: new Date().toISOString(),
      updatedBy: auth.currentUser?.email || 'Unknown user'
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

    // Validate required fields
    const requiredFields = ['title', 'description', 'numberOfTexts', 'textFields'];
    const missingFields = requiredFields.filter(field => !resourceData[field]);
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    const resourceRef = doc(db, 'resources', resourceData.id);
    const updateData = {
      ...resourceData,
      updatedAt: new Date().toISOString(),
      updatedBy: auth.currentUser.email || 'Unknown user'
    };

    console.log('Updating resource:', updateData);
    await updateDoc(resourceRef, updateData);
    
    console.log('Resource updated successfully:', updateData);
    return updateData;
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
