import { db } from "@/lib/firebase";
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, getDoc, query, orderBy, where } from "firebase/firestore";
import type { FirebaseInfo, FirebaseUser } from "./types";
import type { User } from "@/lib/types";

const INFO_COLLECTION = "info";

// Helper function to get user info from Firestore
const getUserFromFirestore = async (userId: string): Promise<FirebaseUser | null> => {
  try {
    const snapshot = await getDoc(doc(db, 'users', userId));
    if (!snapshot.exists()) {
      return null;
    }
    
    const data = snapshot.data();
    return {
      uid: userId,
      email: data.email || "",
      firstName: data.firstName || "",
      lastName: data.lastName || "",
      name: data.name || data.username || "",
      username: data.username || "",
      role: data.role || "user",
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: data.updatedAt || new Date().toISOString()
    };
  } catch (error) {
    console.error('Error getting user info:', error);
    return null;
  }
};

// Helper function to convert User to FirebaseUser
const convertToFirebaseUser = async (user: User, timestamp: string): Promise<FirebaseUser> => {
  // Try to get user data from Firestore first
  const firestoreUser = await getUserFromFirestore(user.uid);
  if (firestoreUser) {
    return {
      ...firestoreUser,
      updatedAt: timestamp // Always update the timestamp
    };
  }

  // Fallback to auth user data if Firestore data is not available
  return {
    uid: user.uid,
    email: user.email || "",
    firstName: user.firstName || "",
    lastName: user.lastName || "",
    name: user.username,
    username: user.username,
    role: user.role,
    createdAt: timestamp,
    updatedAt: timestamp
  };
};

export type PageType = 'aboutus' | 'membership';
export type SubType = 'top' | 'bottom';

export async function createInfo(
  title: string,
  icon: string,
  text: string,
  page: 'aboutus' | 'membership',
  user: User,
  sub?: 'top' | 'bottom',
  texts?: string[],
  url1Title?: string,
  url1?: string,
  url2Title?: string,
  url2?: string
): Promise<FirebaseInfo> {
  const now = new Date().toISOString();
  const firebaseUser = await convertToFirebaseUser(user, now);
  
  // Get the current max order for this page/sub combination
  let q = query(collection(db, INFO_COLLECTION));
  if (page === 'membership' && sub) {
    q = query(
      collection(db, INFO_COLLECTION),
      where('page', '==', page),
      where('sub', '==', sub)
    );
  } else {
    q = query(collection(db, INFO_COLLECTION), where('page', '==', page));
  }
  
  const querySnapshot = await getDocs(q);
  const maxOrder = querySnapshot.docs.reduce((max, doc) => {
    const data = doc.data();
    return Math.max(max, data.order || 0);
  }, -1);
  
  // Create base info data
  const baseData = {
    title,
    icon,
    text,
    page,
    order: maxOrder + 1,
    userId: user.uid,
    createdBy: firebaseUser,
    createdAt: now,
    updatedBy: firebaseUser,
    updatedAt: now,
  };

  // Add membership-specific fields only if page is membership
  const infoData = page === 'membership'
    ? {
        ...baseData,
        sub,
        texts: texts || [],
        url1Title: url1Title || "",
        url1: url1 || "",
        url2Title: url2Title || "",
        url2: url2 || ""
      }
    : baseData;

  const docRef = await addDoc(collection(db, INFO_COLLECTION), infoData);
  return {
    id: docRef.id,
    ...infoData,
  };
}

export async function updateInfo(
  id: string,
  data: {
    title?: string;
    icon?: string;
    text?: string;
    page?: PageType;
    sub?: SubType;
    texts?: string[];
    url1Title?: string;
    url1?: string;
    url2Title?: string;
    url2?: string;
    order?: number;
  },
  user: User
): Promise<void> {
  // Validate page value
  if (data.page && !['aboutus', 'membership'].includes(data.page)) {
    throw new Error(`Invalid page value: ${data.page}. Must be either 'aboutus' or 'membership'`);
  }

  const now = new Date().toISOString();
  const firebaseUser = await convertToFirebaseUser(user, now);

  // If order is being updated, ensure it's a valid number
  if (data.order !== undefined && (typeof data.order !== 'number' || isNaN(data.order))) {
    throw new Error('Order must be a valid number');
  }

  const updateData = {
    ...data,
    updatedBy: firebaseUser,
    updatedAt: now,
  };

  await updateDoc(doc(db, INFO_COLLECTION, id), updateData);
}

export async function deleteInfo(id: string): Promise<void> {
  await deleteDoc(doc(db, INFO_COLLECTION, id));
}

export async function fetchInfo(page?: PageType, sub?: SubType): Promise<FirebaseInfo[]> {
  try {
    let q;
    
    // Basic query without order first to see all documents
    if (page === 'aboutus') {
      q = query(
        collection(db, INFO_COLLECTION),
        where('page', '==', 'aboutus')
      );
    } else if (page === 'membership' && sub) {
      q = query(
        collection(db, INFO_COLLECTION),
        where('page', '==', 'membership'),
        where('sub', '==', sub)
      );
    } else {
      q = query(collection(db, INFO_COLLECTION));
    }
    
    const querySnapshot = await getDocs(q);
    
    // Log detailed information about each document
    console.log('All documents:', querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })));
    
    // Convert order to number if it's not already
    const results = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        order: typeof data.order === 'number' ? data.order : parseInt(data.order) || 0
      } as FirebaseInfo;
    });
    
    // Sort by order in memory to ensure it works
    results.sort((a, b) => (a.order || 0) - (b.order || 0));
    
    console.log('Sorted results:', results.map(r => ({
      id: r.id,
      title: r.title,
      order: r.order
    })));
    
    return results;
  } catch (error) {
    console.error('Error in fetchInfo:', error);
    throw error;
  }
}

export async function getInfo(id: string): Promise<FirebaseInfo | null> {
  const docRef = doc(db, INFO_COLLECTION, id);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) {
    return null;
  }

  return {
    id: docSnap.id,
    ...docSnap.data()
  } as FirebaseInfo;
}

export async function updateOrder(id: string, newOrder: number, user: User): Promise<void> {
  try {
    const now = new Date().toISOString();
    const firebaseUser = await convertToFirebaseUser(user, now);

    const updateData = {
      order: newOrder,
      updatedBy: firebaseUser,
      updatedAt: now,
    };

    await updateDoc(doc(db, INFO_COLLECTION, id), updateData);
    console.log('Updated order for document:', { id, newOrder });
  } catch (error) {
    console.error('Error updating order:', error);
    throw error;
  }
} 