import { collection, addDoc, getDocs, query, where, deleteDoc, doc, updateDoc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase-config';
import { type FirebaseNews, type UserInfo } from './types';
import { generateSlug, makeSlugUnique } from './utils';

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

export const createNews = async (newsData: Omit<FirebaseNews, 'id' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy' | 'slug'>): Promise<FirebaseNews> => {
  try {
    if (!auth.currentUser) {
      throw new Error('Authentication required to create news');
    }

    const currentUserId = auth.currentUser.uid;
    const userInfo = await getUserInfo(currentUserId);

    // Generate base slug from title
    let baseSlug = generateSlug(newsData.title);

    // Get all existing news to check for slug uniqueness
    const newsSnapshot = await getDocs(collection(db, 'news'));
    const existingSlugs = newsSnapshot.docs.map(doc => {
      const data = doc.data();
      return data.slug || '';
    });

    // Make the slug unique
    const uniqueSlug = makeSlugUnique(baseSlug, existingSlugs);

    const newNews = {
      ...newsData,
      slug: uniqueSlug,
      userId: currentUserId,
      createdBy: userInfo,
      createdAt: new Date().toISOString(),
      updatedBy: userInfo,
      updatedAt: new Date().toISOString()
    };

    const docRef = await addDoc(collection(db, 'news'), newNews);
    
    return {
      id: docRef.id,
      ...newNews
    } as FirebaseNews;
  } catch (error) {
    console.error('Error creating news:', error);
    throw error;
  }
};

export const updateNews = async (newsId: string, newsData: Partial<FirebaseNews>): Promise<FirebaseNews> => {
  try {
    if (!auth.currentUser) {
      throw new Error('Authentication required to update news');
    }

    const currentUserId = auth.currentUser.uid;
    const userInfo = await getUserInfo(currentUserId);

    // If title is being updated, generate new slug
    let slugUpdate = {};
    if (newsData.title) {
      let baseSlug = generateSlug(newsData.title);
      
      // Get all existing news to check for slug uniqueness
      const newsSnapshot = await getDocs(collection(db, 'news'));
      const existingSlugs = newsSnapshot.docs.map(doc => {
        const data = doc.data();
        return doc.id !== newsId ? (data.slug || '') : ''; // Exclude current news's slug
      }).filter(Boolean);

      // Make the slug unique
      const uniqueSlug = makeSlugUnique(baseSlug, existingSlugs);
      slugUpdate = { slug: uniqueSlug };
    }

    const updatedNews = {
      ...newsData,
      ...slugUpdate,
      updatedBy: userInfo,
      updatedAt: new Date().toISOString()
    };

    const newsRef = doc(db, 'news', newsId);
    await updateDoc(newsRef, updatedNews);

    // Get the updated document
    const updatedDoc = await getDoc(newsRef);
    if (!updatedDoc.exists()) {
      throw new Error('News not found');
    }

    return {
      id: newsId,
      ...updatedDoc.data()
    } as FirebaseNews;
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
