import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Target, Trophy, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { EditInfoModal } from "@/components/modals/EditInfoModal";
import { fetchInfo } from "@/lib/firebase/info";
import type { FirebaseInfo } from "@/lib/firebase/types";

const CARD_ICONS = {
  building: Building2,
  target: Target,
  trophy: Trophy,
};

export function About() {
  const { user } = useAuth();
  const [infoCards, setInfoCards] = useState<FirebaseInfo[]>([]);
  const [editingInfo, setEditingInfo] = useState<FirebaseInfo | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [highlightedSection, setHighlightedSection] = useState<number | null>(null);

  useEffect(() => {
    const loadInfo = async () => {
      try {
        const info = await fetchInfo('aboutus');
        console.log('About page loaded info:', info);
        setInfoCards(info);
      } catch (error) {
        console.error('Error loading info:', error);
      }
    };

    loadInfo();
  }, []);

  // Handle anchor scrolling and highlighting
  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const sectionNumber = parseInt(hash.replace('#', ''));
      if (!isNaN(sectionNumber) && sectionNumber >= 1 && sectionNumber <= 3) {
        const element = document.getElementById(`section-${sectionNumber}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
          setHighlightedSection(sectionNumber);
          
          // Remove highlight after animation
          setTimeout(() => {
            setHighlightedSection(null);
          }, 2000);
        }
      }
    }
  }, [infoCards]); // Re-run when cards are loaded

  const handleEditSuccess = async () => {
    // Reload info after successful edit
    const info = await fetchInfo('aboutus');
    setInfoCards(info);
  };

  return (
    <section className="w-full">
      <div className="container px-4 mx-auto">
        <div className="grid gap-6 md:grid-cols-3 mx-auto max-w-[1400px] place-items-center pt-2">
          {infoCards.map((info, index) => {
            const IconComponent = CARD_ICONS[info.icon as keyof typeof CARD_ICONS] || Building2;
            const isHighlighted = highlightedSection === index + 1;
            
            return (
              <Card 
                key={info.id}
                id={`section-${index + 1}`}
                className={`flex flex-col transition-all duration-300 hover:shadow-lg animate-fade-in hover:-translate-y-1 w-full max-w-[400px] scroll-mt-20
                  ${isHighlighted ? 'ring-4 ring-[#b3a369] ring-opacity-50 shadow-lg scale-105' : ''}`}
                style={{
                  animationDelay: `${index * 100}ms`,
                  transition: 'all 0.3s ease-in-out'
                }}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-2xl font-bold text-[#003c71] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <IconComponent className="h-6 w-6" />
                      {info.title}
                    </div>
                    {user?.role === 'admin' && (
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          setEditingInfo(info);
                          setIsEditModalOpen(true);
                        }}
                        className="h-8 w-8 border border-gray-200 hover:bg-[#003c71] hover:text-white"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div 
                    className="text-gray-600"
                    dangerouslySetInnerHTML={{ __html: info.text.replace(/\n/g, '<br>') }}
                  />
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <EditInfoModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingInfo(null);
        }}
        info={editingInfo}
        onSuccess={handleEditSuccess}
      />
    </section>
  );
}
