import { collection, addDoc, getDocs, query, where, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { auth, db } from './firebase-config';
import type { FirebaseEvent } from './types';

export const createEvent = async (eventData: Omit<FirebaseEvent, 'id' | 'createdAt' | 'userCreated'>): Promise<FirebaseEvent> => {
  try {
    if (!auth.currentUser) {
      throw new Error('Authentication required to create event');
    }

    const newEvent = {
      ...eventData,
      createdAt: new Date().toISOString(),
      userCreated: auth.currentUser?.displayName || auth.currentUser?.email || 'Unknown user',
      updatedAt: new Date().toISOString(),
      updatedBy: auth.currentUser?.displayName || auth.currentUser?.email || 'Unknown user'
    };

    const docRef = await addDoc(collection(db, 'events'), newEvent);
    
    return {
      id: docRef.id,
      ...newEvent
    } as FirebaseEvent;
  } catch (error) {
    console.error('Error creating event:', error);
    throw error;
  }
};

export const updateEvent = async (eventData: FirebaseEvent): Promise<void> => {
  try {
    if (!auth.currentUser) {
      throw new Error('Authentication required to update event');
    }

    if (!eventData.id) {
      throw new Error('Event ID is required for update');
    }

    const eventRef = doc(db, 'events', eventData.id);
    const updateData = {
      ...eventData,
      updatedAt: new Date().toISOString(),
      updatedBy: auth.currentUser.displayName || auth.currentUser.email || 'Unknown user'
    };

    await updateDoc(eventRef, updateData);
  } catch (error) {
    console.error('Error updating event:', error);
    throw error;
  }
};

export const deleteEvent = async (eventId: string): Promise<void> => {
  try {
    if (!auth.currentUser) {
      throw new Error('Authentication required to delete event');
    }

    const eventRef = doc(db, 'events', eventId);
    await deleteDoc(eventRef);
  } catch (error) {
    console.error('Error deleting event:', error);
    throw error;
  }
};

export const fetchEvents = async (): Promise<FirebaseEvent[]> => {
  try {
    const eventsRef = collection(db, 'events');
    const eventsSnapshot = await getDocs(eventsRef);
    
    return eventsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as FirebaseEvent));
  } catch (error) {
    console.error('Error fetching events:', error);
    throw error;
  }
};

export type { FirebaseEvent };
