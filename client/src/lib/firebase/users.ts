import { collection, getDocs, query, where, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { auth, db } from './firebase-config';

export interface FirebaseUser {
  uid: string;
  firstName: string;
  lastName: string;
  name: string;
  username: string;
  email: string;
  role: 'admin' | 'editor' | 'user';
  createdAt: string;
  updatedAt: string;
}

export const fetchUsers = async (): Promise<FirebaseUser[]> => {
  try {
    if (!auth.currentUser) {
      throw new Error('Authentication required to fetch users');
    }

    // Get admin token
    const token = await auth.currentUser.getIdToken();
    
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);
    
    return usersSnapshot.docs.map(doc => {
      const data = doc.data();
      const firstName = data.firstName || '';
      const lastName = data.lastName || '';
      return {
        uid: doc.id,
        firstName,
        lastName,
        name: `${firstName} ${lastName}`.trim(),
        username: data.username || '',
        email: data.email || '',
        role: data.role || 'user',
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : new Date().toISOString()
      } as FirebaseUser;
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

export const updateUser = async (uid: string, data: Partial<FirebaseUser>) => {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, data);
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

export const deleteUser = async (uid: string) => {
  try {
    if (!auth.currentUser) {
      throw new Error('Authentication required to delete user');
    }

    // Get admin token
    const token = await auth.currentUser.getIdToken();
    
    // Call admin endpoint to delete user from both Auth and Firestore
    const response = await fetch(`/api/admin/users/${uid}/delete`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Failed to delete user');
    }
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};
