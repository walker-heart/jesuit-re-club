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
  createdAt?: string;
  updatedAt?: string;
  password?: string;
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
    if (!auth.currentUser) {
      throw new Error('Authentication required to update user');
    }

    const token = await auth.currentUser.getIdToken();
    
    // Prepare update data, preserving creation time and updating the update time
    const updateData = {
      ...data,
      updatedAt: new Date().toISOString()
    };
    
    // Remove sensitive fields that shouldn't be updated
    delete updateData.uid;
    delete updateData.createdAt;
    
    const response = await fetch(`/api/admin/users/${uid}/update`, {
      method: 'PUT',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(updateData)
    });

    // Parse response carefully to avoid JSON parse errors
    let responseData;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      const text = await response.text();
      throw new Error(text || 'Invalid server response');
    }

    if (!response.ok || !responseData.success) {
      throw new Error(responseData.message || 'Failed to update user');
    }

    // Don't update Firestore document - the server already handles this
    return {
      ...data,
      ...updateData
    };
  } catch (error: any) {
    console.error('Error updating user:', error);
    throw new Error(error.message || 'Failed to update user');
  }
};

export const createUser = async (userData: Omit<FirebaseUser, 'uid'>) => {
  try {
    if (!auth.currentUser) {
      throw new Error('Authentication required to create user');
    }

    const token = await auth.currentUser.getIdToken();
    
    // Process and validate user data
    const processedData = {
      ...userData,
      role: userData.role || 'user',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const response = await fetch('/api/admin/users/create', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(processedData)
    });

    // Parse response carefully to avoid JSON parse errors
    let responseData;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      const text = await response.text();
      throw new Error(text || 'Invalid server response');
    }

    if (!response.ok || !responseData.success || !responseData.user) {
      throw new Error(responseData.message || 'Failed to create user');
    }

    const { user } = responseData;
    
    // Don't create duplicate Firestore document - the server already handles this
    return {
      ...processedData,
      uid: user.uid
    };
  } catch (error: any) {
    console.error('Error creating user:', error);
    throw new Error(error.message || 'Failed to create user');
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
