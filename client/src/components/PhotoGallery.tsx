import { useState, useEffect } from 'react';
import { storage } from '@/lib/firebase';
import { ref, listAll, getDownloadURL } from 'firebase/storage';
import { Card } from '@/components/ui/card';

export function PhotoGallery() {
  const [photos, setPhotos] = useState<string[]>([]);

  useEffect(() => {
    const fetchPhotos = async () => {
      const storageRef = ref(storage, 'gallery');
      const result = await listAll(storageRef);
      const urls = await Promise.all(
        result.items.map(fileRef => getDownloadURL(fileRef))
      );
      setPhotos(urls);
    };

    fetchPhotos().catch(console.error);
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {photos.map((url, index) => (
        <Card key={index} className="overflow-hidden">
          <img 
            src={url} 
            alt={`Gallery photo ${index + 1}`}
            className="w-full h-48 object-cover"
          />
        </Card>
      ))}
    </div>
  );
}
