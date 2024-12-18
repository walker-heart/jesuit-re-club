import { collection, addDoc, getDocs, query, where, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { auth, db } from './firebase-config';

import type { FirebaseResource } from './types';

export const createResource = async (resourceData: Omit<FirebaseResource, 'id' | 'createdAt' | 'userCreated'>): Promise<FirebaseResource> => {
  try {
    if (!auth.currentUser) {
      throw new Error('Authentication required to create resource');
    }

    const newResource = {
      ...resourceData,
      createdAt: new Date().toISOString(),
      userCreated: auth.currentUser?.displayName || auth.currentUser?.email || 'Unknown user',
      updatedAt: new Date().toISOString(),
      updatedBy: auth.currentUser?.displayName || auth.currentUser?.email || 'Unknown user'
    };

    const docRef = await addDoc(collection(db, 'resources'), newResource);
    
    return {
      id: docRef.id,
      ...newResource
    } as FirebaseResource;
  } catch (error) {
    console.error('Error creating resource:', error);
    throw error;
  }
};

export const updateResource = async (resourceData: FirebaseResource): Promise<void> => {
  try {
    if (!auth.currentUser) {
      throw new Error('Authentication required to update resource');
    }

    if (!resourceData.id) {
      throw new Error('Resource ID is required for update');
    }

    const resourceRef = doc(db, 'resources', resourceData.id);
    const updateData = {
      ...resourceData,
      updatedAt: new Date().toISOString(),
      updatedBy: auth.currentUser.displayName || auth.currentUser.email || 'Unknown user'
    };

    await updateDoc(resourceRef, updateData);
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
