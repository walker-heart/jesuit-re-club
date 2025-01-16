import { collection, addDoc, getDocs, query, where, deleteDoc, doc, updateDoc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase-config';
import type { FirebaseEvent, UserInfo } from './types';
import { generateSlug, makeSlugUnique } from './utils';

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

export const createEvent = async (eventData: Omit<FirebaseEvent, 'id' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy' | 'slug'>): Promise<FirebaseEvent> => {
  try {
    if (!auth.currentUser) {
      throw new Error('Authentication required to create event');
    }

    const currentUserId = auth.currentUser.uid;
    const userInfo = await getUserInfo(currentUserId);

    // Generate base slug from title
    let baseSlug = generateSlug(eventData.title);

    // Get all existing events to check for slug uniqueness
    const eventsSnapshot = await getDocs(collection(db, 'events'));
    const existingSlugs = eventsSnapshot.docs.map(doc => {
      const data = doc.data();
      return data.slug || '';
    });

    // Make the slug unique
    const uniqueSlug = makeSlugUnique(baseSlug, existingSlugs);

    const newEvent = {
      ...eventData,
      slug: uniqueSlug,
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

export const updateEvent = async (eventId: string, eventData: Partial<FirebaseEvent>): Promise<FirebaseEvent> => {
  try {
    if (!auth.currentUser) {
      throw new Error('Authentication required to update event');
    }

    const currentUserId = auth.currentUser.uid;
    const userInfo = await getUserInfo(currentUserId);

    // If title is being updated, generate new slug
    let slugUpdate = {};
    if (eventData.title) {
      let baseSlug = generateSlug(eventData.title);
      
      // Get all existing events to check for slug uniqueness
      const eventsSnapshot = await getDocs(collection(db, 'events'));
      const existingSlugs = eventsSnapshot.docs.map(doc => {
        const data = doc.data();
        return doc.id !== eventId ? (data.slug || '') : ''; // Exclude current event's slug
      }).filter(Boolean);

      // Make the slug unique
      const uniqueSlug = makeSlugUnique(baseSlug, existingSlugs);
      slugUpdate = { slug: uniqueSlug };
    }

    const updatedEvent = {
      ...eventData,
      ...slugUpdate,
      updatedBy: userInfo,
      updatedAt: new Date().toISOString()
    };

    const eventRef = doc(db, 'events', eventId);
    await updateDoc(eventRef, updatedEvent);

    // Get the updated document
    const updatedDoc = await getDoc(eventRef);
    if (!updatedDoc.exists()) {
      throw new Error('Event not found');
    }

    return {
      id: eventId,
      ...updatedDoc.data()
    } as FirebaseEvent;
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
    
    return eventsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title || '',
        date: data.date || '',
        time: data.time || '',
        location: data.location || '',
        speaker: data.speaker || '',
        speakerDescription: data.speakerDescription || '',
        agenda: data.agenda || '',
        url: data.url,
        userId: data.userId || '',
        createdBy: data.createdBy || { firstName: '', lastName: '', email: '' },
        createdAt: data.createdAt || new Date().toISOString(),
        updatedBy: data.updatedBy || { firstName: '', lastName: '', email: '' },
        updatedAt: data.updatedAt || new Date().toISOString()
      };
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    throw error;
  }
};

export type { FirebaseEvent };
