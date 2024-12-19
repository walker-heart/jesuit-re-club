import { doc, updateDoc } from 'firebase/firestore';
import { db } from './firebase-config';
import type { FirebaseResource } from './types';

export async function updateResourceInFirebase(resource: FirebaseResource): Promise<void> {
  console.log('Starting resource update process:', resource);
  
  // Validate required fields
  const requiredFields = ['id', 'title', 'description', 'numberOfTexts', 'textFields'];
  const missingFields = requiredFields.filter(field => !resource[field as keyof FirebaseResource]);
  
  if (missingFields.length > 0) {
    const error = `Missing required fields: ${missingFields.join(', ')}`;
    console.error('Update validation failed:', error);
    throw new Error(error);
  }

  if (!resource.id) {
    console.error('Update failed: No resource ID provided');
    throw new Error('Resource ID is required for update');
  }

  try {
    const resourceRef = doc(db, 'resources', resource.id);
    
    // Prepare update data with only the fields that should be updated
    const updateData = {
      title: resource.title,
      description: resource.description,
      numberOfTexts: resource.numberOfTexts,
      textFields: resource.textFields,
      updatedAt: new Date().toISOString()
    };

    console.log('Updating resource with data:', updateData);
    
    // Update the document in Firebase
    await updateDoc(resourceRef, updateData);
    
    console.log('Resource updated successfully:', resource.id);
  } catch (error: any) {
    console.error('Error updating resource:', error);
    console.error('Failed update data:', resource);
    
    // Provide more specific error messages
    if (error.code === 'not-found') {
      throw new Error('Resource not found in database');
    } else if (error.code === 'permission-denied') {
      throw new Error('You do not have permission to update this resource');
    } else {
      throw new Error(error.message || 'Failed to update resource');
    }
  }
}
