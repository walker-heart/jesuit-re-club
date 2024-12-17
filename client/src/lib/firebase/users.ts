import { getAuth } from 'firebase/auth';
import { getFirestore, collection, getDocs, query, where, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from './firebase-config';

export interface FirebaseUser {
  uid: string;
  email: string;
  displayName: string;
  role: 'admin' | 'editor' | 'user';
  createdAt?: string;
}

export const fetchUsers = async (): Promise<FirebaseUser[]> => {
  try {
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);
    return usersSnapshot.docs.map(doc => ({
      uid: doc.id,
      ...doc.data()
    } as FirebaseUser));
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
    const userRef = doc(db, 'users', uid);
    await deleteDoc(userRef);
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};
