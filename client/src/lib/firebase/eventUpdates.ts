import { doc, updateDoc } from 'firebase/firestore';
import { db } from './firebase-config';
import type { FirebaseEvent } from './events';

export async function updateEventInFirebase(event: FirebaseEvent): Promise<void> {
  if (!event.id) {
    throw new Error('Event ID is required for update');
  }

  try {
    const eventRef = doc(db, 'events', event.id);
    const updateData = {
      title: event.title,
      date: event.date,
      time: event.time,
      location: event.location,
      speaker: event.speaker,
      speakerDescription: event.speakerDescription,
      agenda: event.agenda,
      updatedAt: new Date().toISOString()
    };

    await updateDoc(eventRef, updateData);
  } catch (error: any) {
    console.error('Error updating event:', error);
    throw new Error(error.message || 'Failed to update event');
  }
}
