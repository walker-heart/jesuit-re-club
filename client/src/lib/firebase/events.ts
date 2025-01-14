import { collection, addDoc, getDocs, query, where, deleteDoc, doc, updateDoc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase-config';
import type { FirebaseEvent, UserInfo } from './types';

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

export const createEvent = async (eventData: Omit<FirebaseEvent, 'id' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>): Promise<FirebaseEvent> => {
  try {
    if (!auth.currentUser) {
      throw new Error('Authentication required to create event');
    }

    const currentUserId = auth.currentUser.uid;
    const userInfo = await getUserInfo(currentUserId);

    const newEvent = {
      ...eventData,
      userId: currentUserId,
      createdBy: userInfo,
      createdAt: new Date().toISOString(),
      updatedBy: userInfo,
      updatedAt: new Date().toISOString()
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

export const updateEvent = async (eventData: FirebaseEvent): Promise<FirebaseEvent> => {
  try {
    if (!auth.currentUser) {
      throw new Error('Authentication required to update event');
    }

    if (!eventData.id) {
      throw new Error('Event ID is required for update');
    }

    // Validate required fields
    const requiredFields = ['title', 'date', 'time', 'location', 'speaker', 'speakerDescription', 'agenda'] as const;
    const missingFields = requiredFields.filter(field => {
      const value = eventData[field];
      return !value || value.toString().trim() === '';
    });
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    const currentUserId = auth.currentUser.uid;
    const userInfo = await getUserInfo(currentUserId);

    const eventRef = doc(db, 'events', eventData.id);
    const updateData = {
      ...eventData,
      updatedBy: userInfo,
      updatedAt: new Date().toISOString()
    };

    await updateDoc(eventRef, updateData);
    
    return {
      ...updateData,
      id: eventData.id
    } as FirebaseEvent;
  } catch (error: any) {
    console.error('Error updating event:', error);
    if (error.code === 'permission-denied') {
      throw new Error('You do not have permission to update this event');
    }
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
