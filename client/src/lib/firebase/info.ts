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
  
  // Create base info data
  const baseData = {
    title,
    icon,
    text,
    page,
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
    page?: 'aboutus' | 'membership';
    sub?: 'top' | 'bottom';
    texts?: string[];
    url1Title?: string;
    url1?: string;
    url2Title?: string;
    url2?: string;
  },
  user: User
): Promise<void> {
  const now = new Date().toISOString();
  const firebaseUser = await convertToFirebaseUser(user, now);

  // Create base update data
  const baseData = {
    ...data,
    updatedBy: firebaseUser,
    updatedAt: now,
  };

  // If updating to membership page, ensure all membership fields have default values
  const updateData = data.page === 'membership'
    ? {
        ...baseData,
        texts: data.texts || [],
        url1Title: data.url1Title || "",
        url1: data.url1 || "",
        url2Title: data.url2Title || "",
        url2: data.url2 || ""
      }
    : baseData;

  // If updating to about us page, remove membership-specific fields
  if (data.page === 'aboutus') {
    delete updateData.sub;
    delete updateData.texts;
    delete updateData.url1Title;
    delete updateData.url1;
    delete updateData.url2Title;
    delete updateData.url2;
  }

  await updateDoc(doc(db, INFO_COLLECTION, id), updateData);
}

export async function deleteInfo(id: string): Promise<void> {
  await deleteDoc(doc(db, INFO_COLLECTION, id));
}

export async function fetchInfo(page?: 'aboutus' | 'membership', sub?: 'top' | 'bottom'): Promise<FirebaseInfo[]> {
  let q = query(collection(db, INFO_COLLECTION));
  
  if (page) {
    if (sub) {
      q = query(
        collection(db, INFO_COLLECTION), 
        where('page', '==', page),
        where('sub', '==', sub)
      );
    } else {
      q = query(collection(db, INFO_COLLECTION), where('page', '==', page));
    }
  }
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as FirebaseInfo));
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