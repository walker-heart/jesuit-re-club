import { collection, getDocs, query, where, deleteDoc, doc, updateDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase-config';

export interface FirebaseUser {
  uid: string;
  firstName: string;
  lastName: string;
  name: string;
  username: string;
  email: string;
  role: 'admin' | 'editor' | 'user' | 'test';
  createdAt: string;
  updatedAt: string;
}

export const fetchUsers = async (): Promise<FirebaseUser[]> => {
  try {
    if (!auth.currentUser) {
      throw new Error('Authentication required to fetch users');
    }

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
        createdAt: data.createdAt?.toDate?.() 
          ? data.createdAt.toDate().toISOString() 
          : typeof data.createdAt === 'string' 
            ? data.createdAt 
            : new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate?.() 
          ? data.updatedAt.toDate().toISOString() 
          : typeof data.updatedAt === 'string'
            ? data.updatedAt
            : new Date().toISOString()
      } as FirebaseUser;
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

export const updateUser = async (uid: string, data: Partial<FirebaseUser>) => {
  try {
    if (!uid) throw new Error('User ID is required for update');
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      ...data,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

export const createUser = async (userData: Omit<FirebaseUser, 'uid'>) => {
  try {
    if (!auth.currentUser) {
      throw new Error('Authentication required to create user');
    }

    const token = await auth.currentUser.getIdToken();
    
    // Ensure firstName and lastName are present
    const firstName = userData.firstName || userData.username || '';
    const lastName = userData.lastName || '';
    
    const newUserData = {
      ...userData,
      firstName,
      lastName,
      name: `${firstName} ${lastName}`.trim(),
      uid: auth.currentUser.uid,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Create the user document in Firestore
    const userRef = doc(db, 'users', auth.currentUser.uid);
    await setDoc(userRef, newUserData);

    console.log('Created user with data:', newUserData);
    return newUserData;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

export const deleteUser = async (uid: string) => {
  try {
    if (!auth.currentUser) {
      throw new Error('Authentication required to delete user');
    }

    const token = await auth.currentUser.getIdToken();
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
