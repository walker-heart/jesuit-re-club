import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getGalleryImages, type GalleryImage } from "@/lib/firebase/gallery";

export function HomeCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGalleryImages();
  }, []);

  useEffect(() => {
    if (images.length === 0) return;

    const timer = setInterval(() => {
      nextSlide();
    }, 5000); // Rotate every 5 seconds

    return () => clearInterval(timer);
  }, [images]);

  const loadGalleryImages = async () => {
    try {
      const galleryImages = await getGalleryImages();
      setImages(galleryImages);
    } catch (error) {
      console.error('Error loading gallery images:', error);
    } finally {
      setLoading(false);
    }
  };

  const nextSlide = () => {
    if (images.length === 0) return;
    setIsTransitioning(true);
    setCurrentIndex((current) => (current + 1) % images.length);
    setTimeout(() => setIsTransitioning(false), 500);
  };

  const prevSlide = () => {
    if (images.length === 0) return;
    setIsTransitioning(true);
    setCurrentIndex((current) => (current - 1 + images.length) % images.length);
    setTimeout(() => setIsTransitioning(false), 500);
  };

  if (loading) {
    return (
      <div className="relative w-full max-w-4xl mx-auto animate-fade-in">
        <Card className="overflow-hidden shadow-2xl">
          <div className="relative aspect-[16/9] w-full bg-gray-100 animate-pulse" />
        </Card>
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="relative w-full max-w-4xl mx-auto animate-fade-in">
        <Card className="overflow-hidden shadow-2xl">
          <div className="relative aspect-[16/9] w-full bg-gray-100 flex items-center justify-center">
            <p className="text-gray-500">No images available</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-4xl mx-auto animate-fade-in">
      <Card className="overflow-hidden shadow-2xl">
        <div className="relative aspect-[16/9] w-full">
          <img
            src={images[currentIndex].imageUrl}
            alt={images[currentIndex].title}
            className={`w-full h-full object-cover transition-opacity duration-500 ${
              isTransitioning ? 'opacity-0' : 'opacity-100'
            }`}
          />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent text-white p-4">
            <p className="text-center text-lg font-semibold animate-fade-in">
              {images[currentIndex].title}
            </p>
          </div>
          <button
            onClick={prevSlide}
            className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-1.5 rounded-full transition-colors animate-fade-in"
            aria-label="Previous photo"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-1.5 rounded-full transition-colors animate-fade-in"
            aria-label="Next photo"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>
      </Card>
      <div className="flex justify-center mt-4 gap-2">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === currentIndex ? 'bg-[#003c71] scale-125' : 'bg-gray-300 hover:bg-gray-400'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
} 