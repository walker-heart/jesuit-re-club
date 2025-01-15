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

  useEffect(() => {
    const loadInfo = async () => {
      try {
        const info = await fetchInfo('aboutus');
        setInfoCards(info);
      } catch (error) {
        console.error('Error loading info:', error);
      }
    };

    loadInfo();
  }, []);

  const handleEditSuccess = async () => {
    // Reload info after successful edit
    const info = await fetchInfo();
    setInfoCards(info);
  };

  return (
    <section className="w-full py-8 md:py-12">
      <div className="container px-4 md:px-6 mx-auto">
        <div className="grid gap-6 md:grid-cols-3 mx-auto max-w-[1400px] place-items-center">
          {infoCards.map((info, index) => {
            const IconComponent = CARD_ICONS[info.icon as keyof typeof CARD_ICONS] || Building2;
            
            return (
              <Card 
                key={info.id} 
                className="flex flex-col transition-all duration-300 hover:shadow-lg animate-fade-in hover:-translate-y-1 w-full max-w-[400px]"
                style={{animationDelay: `${index * 100}ms`}}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-2xl font-bold text-[#003c71] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <IconComponent className="h-6 w-6" />
                      {info.title}
                    </div>
                    {user?.role === 'admin' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditingInfo(info);
                          setIsEditModalOpen(true);
                        }}
                        className="ml-2 hover:bg-[#003c71] hover:text-white"
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
