import { collection, getDocs, query, where, deleteDoc, doc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase-config';

export interface FirebaseUser {
  uid: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  role: 'admin' | 'editor' | 'user';
  createdAt: string;
  updatedAt: string;
}

export const createUser = async (userData: Omit<FirebaseUser, 'uid' | 'createdAt' | 'updatedAt'>) => {
  try {
    if (!auth.currentUser) {
      throw new Error('Authentication required to create user');
    }

    const userRef = doc(collection(db, 'users'));
    const timestamp = serverTimestamp();
    
    await setDoc(userRef, {
      ...userData,
      createdAt: timestamp,
      updatedAt: timestamp
    });

    return {
      uid: userRef.id,
      ...userData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

export const fetchUsers = async (): Promise<FirebaseUser[]> => {
  try {
    if (!auth.currentUser) {
      throw new Error('Authentication required to fetch users');
    }
    
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
    await updateDoc(userRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
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
    
    const userRef = doc(db, 'users', uid);
    await deleteDoc(userRef);
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};
