import { collection, addDoc, getDocs, deleteDoc, doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from './firebase-config';
import { type FirebaseNews, type UserInfo } from './types';

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

export const createNews = async (newsData: Omit<FirebaseNews, 'id' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>): Promise<FirebaseNews> => {
  try {
    if (!auth.currentUser) {
      throw new Error('Authentication required to create news');
    }

    const currentUserId = auth.currentUser.uid;
    const userInfo = await getUserInfo(currentUserId);

    const newNews = {
      ...newsData,
      userId: currentUserId,
      createdBy: userInfo,
      createdAt: new Date().toISOString(),
      updatedBy: userInfo,
      updatedAt: new Date().toISOString(),
      isPublished: false // Default to unpublished
    };

    const docRef = await addDoc(collection(db, 'news'), newNews);
    
    return {
      id: docRef.id,
      ...newNews
    };
  } catch (error) {
    console.error('Error creating news:', error);
    throw error;
  }
};

export const updateNews = async (newsData: FirebaseNews): Promise<FirebaseNews> => {
  try {
    if (!auth.currentUser) {
      throw new Error('Authentication required to update news');
    }

    if (!newsData.id) {
      throw new Error('News ID is required for update');
    }

    const currentUserId = auth.currentUser.uid;
    const snapshot = await getDoc(doc(db, 'users', currentUserId));
    const userData = snapshot.exists() ? snapshot.data() : null;
    
    const newsSnapshot = await getDoc(doc(db, 'news', newsData.id));
    
    if (!newsSnapshot.exists()) {
      throw new Error('News not found');
    }

    const existingNews = newsSnapshot.data() as FirebaseNews;

    // Check permissions
    const isAdmin = userData?.role === 'admin';
    if (!isAdmin && existingNews.userId !== currentUserId) {
      throw new Error('You do not have permission to update this news');
    }

    const userInfo = await getUserInfo(currentUserId);

    const updateData = {
      ...newsData,
      updatedBy: userInfo,
      updatedAt: new Date().toISOString()
    };

    await updateDoc(doc(db, 'news', newsData.id), updateData);
    
    return {
      ...existingNews,
      ...updateData
    };
  } catch (error) {
    console.error('Error updating news:', error);
    throw error;
  }
};

export const deleteNews = async (newsId: string): Promise<void> => {
  try {
    if (!auth.currentUser) {
      throw new Error('Authentication required to delete news');
    }

    const currentUserId = auth.currentUser.uid;
    const snapshot = await getDoc(doc(db, 'users', currentUserId));
    const userData = snapshot.exists() ? snapshot.data() : null;
    
    const newsSnapshot = await getDoc(doc(db, 'news', newsId));
    
    if (!newsSnapshot.exists()) {
      throw new Error('News not found');
    }

    const news = newsSnapshot.data() as FirebaseNews;
    
    // Check permissions
    const isAdmin = userData?.role === 'admin';
    if (!isAdmin && news.userId !== currentUserId) {
      throw new Error('You do not have permission to delete this news');
    }

    await deleteDoc(doc(db, 'news', newsId));
  } catch (error) {
    console.error('Error deleting news:', error);
    throw error;
  }
};

export const fetchNews = async (userOnly: boolean = false): Promise<FirebaseNews[]> => {
  try {
    const newsSnapshot = await getDocs(collection(db, 'news'));
    let news = newsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as FirebaseNews));

    // Filter for user's news if requested and user is authenticated
    if (userOnly && auth.currentUser) {
      news = news.filter(newsItem => newsItem.userId === auth.currentUser?.uid);
    }

    // Sort by date, newest first
    return news.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA;
    });
  } catch (error) {
    console.error('Error fetching news:', error);
    throw error;
  }
};
