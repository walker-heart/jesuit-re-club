import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";

// Sample gallery images - replace with actual image URLs
const galleryImages = [
  {
    url: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab",
    alt: "Modern office building",
  },
  {
    url: "https://images.unsplash.com/photo-1560518883-ce09059eeffa",
    alt: "Luxury residential building",
  },
  {
    url: "https://images.unsplash.com/photo-1479839672679-a46483c0e7c8",
    alt: "Downtown skyline",
  },
  {
    url: "https://images.unsplash.com/photo-1460317442991-0ec209397118",
    alt: "Commercial property",
  },
];

export function PhotoGallery() {
  return (
    <Carousel className="w-full max-w-5xl mx-auto">
      <CarouselContent>
        {galleryImages.map((image, index) => (
          <CarouselItem key={index}>
            <div className="p-1">
              <Card>
                <CardContent className="flex aspect-[16/9] items-center justify-center p-0">
                  <img
                    src={image.url}
                    alt={image.alt}
                    className="w-full h-full object-cover"
                  />
                </CardContent>
              </Card>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  );
}
