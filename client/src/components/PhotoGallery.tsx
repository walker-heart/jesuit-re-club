import { useState } from 'react';
import { Card } from "@/components/ui/card";
import { ChevronLeft, ChevronRight } from 'lucide-react';

const photos = [
  {
    url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab',
    alt: 'Real Estate Event 1',
    caption: 'Annual Real Estate Summit'
  },
  {
    url: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa',
    alt: 'Real Estate Event 2',
    caption: 'Downtown Property Tour'
  },
  {
    url: 'https://images.unsplash.com/photo-1479839672679-a46483c0e7c8',
    alt: 'Real Estate Event 3',
    caption: 'Networking Event'
  },
];

export function PhotoGallery() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const nextSlide = () => {
    setIsTransitioning(true);
    setCurrentIndex((current) => (current + 1) % photos.length);
    setTimeout(() => setIsTransitioning(false), 500);
  };

  const prevSlide = () => {
    setIsTransitioning(true);
    setCurrentIndex((current) => (current - 1 + photos.length) % photos.length);
    setTimeout(() => setIsTransitioning(false), 500);
  };

  return (
    <div className="relative w-full max-w-5xl mx-auto animate-fade-in">
      <Card className="overflow-hidden shadow-2xl">
        <div className="relative aspect-[4/3] w-full">
          <img
            src={photos[currentIndex].url}
            alt={photos[currentIndex].alt}
            className={`w-full h-full object-cover transition-opacity duration-500 ${
              isTransitioning ? 'opacity-0' : 'opacity-100'
            }`}
          />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent text-white p-6">
            <p className="text-center text-xl font-semibold animate-fade-in">{photos[currentIndex].caption}</p>
          </div>
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full transition-colors animate-fade-in"
            aria-label="Previous photo"
          >
            <ChevronLeft className="h-8 w-8" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full transition-colors animate-fade-in"
            aria-label="Next photo"
          >
            <ChevronRight className="h-8 w-8" />
          </button>
        </div>
      </Card>
      <div className="flex justify-center mt-6 gap-3">
        {photos.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              index === currentIndex ? 'bg-[#003c71] scale-125' : 'bg-gray-300 hover:bg-gray-400'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
