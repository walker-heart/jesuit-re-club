import { doc, updateDoc } from 'firebase/firestore';
import { db } from './firebase-config';
import type { FirebaseEvent } from './events';

export async function updateEventInFirebase(event: FirebaseEvent): Promise<void> {
  console.log('Starting event update process:', event);
  
  // Validate required fields
  const requiredFields = ['id', 'title', 'date', 'time', 'location', 'speaker', 'speakerDescription', 'agenda'];
  const missingFields = requiredFields.filter(field => !event[field]);
  
  if (missingFields.length > 0) {
    const error = `Missing required fields: ${missingFields.join(', ')}`;
    console.error('Update validation failed:', error);
    throw new Error(error);
  }

  if (!event.id) {
    console.error('Update failed: No event ID provided');
    throw new Error('Event ID is required for update');
  }

  try {
    const eventRef = doc(db, 'events', event.id);
    
    // Prepare update data with only the fields that should be updated
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

    console.log('Updating event with data:', updateData);
    
    // Update the document in Firebase
    await updateDoc(eventRef, updateData);
    
    console.log('Event updated successfully:', event.id);
  } catch (error: any) {
    console.error('Error updating event:', error);
    console.error('Failed update data:', event);
    
    // Provide more specific error messages
    if (error.code === 'not-found') {
      throw new Error('Event not found in database');
    } else if (error.code === 'permission-denied') {
      throw new Error('You do not have permission to update this event');
    } else {
      throw new Error(error.message || 'Failed to update event');
    }
  }
}
