import { db } from './firebase-config';
import { collection, doc, getDocs, setDoc, deleteDoc, query, orderBy } from 'firebase/firestore';

export interface GalleryImage {
  id: string;
  title: string;
  imageUrl: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

const GALLERY_COLLECTION = 'gallery';

export async function getGalleryImages(): Promise<GalleryImage[]> {
  const q = query(collection(db, GALLERY_COLLECTION), orderBy('order'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as GalleryImage);
}

export async function addGalleryImage(image: Omit<GalleryImage, 'id' | 'createdAt' | 'updatedAt'>): Promise<GalleryImage> {
  const id = Date.now().toString();
  const timestamp = new Date().toISOString();
  
  const newImage: GalleryImage = {
    ...image,
    id,
    createdAt: timestamp,
    updatedAt: timestamp
  };

  await setDoc(doc(db, GALLERY_COLLECTION, id), newImage);
  return newImage;
}

export async function updateGalleryImage(image: GalleryImage): Promise<void> {
  const updatedImage = {
    ...image,
    updatedAt: new Date().toISOString()
  };
  await setDoc(doc(db, GALLERY_COLLECTION, image.id), updatedImage);
}

export async function deleteGalleryImage(imageId: string): Promise<void> {
  await deleteDoc(doc(db, GALLERY_COLLECTION, imageId));
}

export async function updateGalleryOrder(images: GalleryImage[]): Promise<void> {
  const timestamp = new Date().toISOString();
  
  // Update all images with new order
  await Promise.all(
    images.map((image, index) => 
      setDoc(doc(db, GALLERY_COLLECTION, image.id), {
        ...image,
        order: index,
        updatedAt: timestamp
      })
    )
  );
} 