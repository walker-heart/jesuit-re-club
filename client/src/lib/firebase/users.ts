import { collection, getDocs, query, where, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { auth, db } from './firebase-config';

export interface FirebaseUser {
  uid: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  role: 'admin' | 'editor' | 'user';
  createdAt?: string;
  updatedAt?: string;
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
      return {
        uid: doc.id,
        firstName: data.firstName || '',
        lastName: data.lastName || '',
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
    
    const userRef = doc(db, 'users', uid);
    await deleteDoc(userRef);
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};
