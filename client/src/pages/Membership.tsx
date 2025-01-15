import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Edit2 } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { EditInfoModal } from "@/components/modals/EditInfoModal";
import { fetchInfo } from "@/lib/firebase/info";
import type { FirebaseInfo } from "@/lib/firebase/types";

export function Membership() {
  const { user } = useAuth();
  const [topContent, setTopContent] = useState<FirebaseInfo[]>([]);
  const [bottomContent, setBottomContent] = useState<FirebaseInfo[]>([]);
  const [editingInfo, setEditingInfo] = useState<FirebaseInfo | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    const loadInfo = async () => {
      try {
        const topInfo = await fetchInfo('membership', 'top');
        const bottomInfo = await fetchInfo('membership', 'bottom');
        setTopContent(topInfo);
        setBottomContent(bottomInfo);
      } catch (error) {
        console.error('Error loading info:', error);
      }
    };

    loadInfo();
  }, []);

  const handleEditSuccess = async () => {
    // Reload info after successful edit
    const topInfo = await fetchInfo('membership', 'top');
    const bottomInfo = await fetchInfo('membership', 'bottom');
    setTopContent(topInfo);
    setBottomContent(bottomInfo);
  };

  return (
    <>
      <section className="w-full py-8 md:py-12 lg:py-16">
        <div className="container px-4 md:px-6 mx-auto flex justify-center">
          <div className="grid gap-10 w-full max-w-[800px]">
            {/* Why Join Card */}
            {topContent.map((info) => (
              <Card key={info.id} className="animate-fade-in card-hover">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold text-[#003c71] flex items-center justify-between">
                    {info.title}
                    {user?.role === 'admin' && (
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          setEditingInfo(info);
                          setIsEditModalOpen(true);
                        }}
                        className="ml-2 hover:bg-[#003c71] hover:text-white border-[#003c71]"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="grid gap-4 mt-4">
                    {info.texts?.map((text, index) => (
                      <li
                        key={index}
                        className="flex items-center space-x-2 animate-fade-in"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <CheckCircle className="h-5 w-5 text-[#b3a369]" />
                        <span className="text-gray-600">{text}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}

            {/* How to Join Card */}
            {bottomContent.map((info) => (
              <Card key={info.id} className="animate-fade-in card-hover">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold text-[#003c71] flex items-center justify-between">
                    {info.title}
                    {user?.role === 'admin' && (
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          setEditingInfo(info);
                          setIsEditModalOpen(true);
                        }}
                        className="ml-2 hover:bg-[#003c71] hover:text-white border-[#003c71]"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-6">
                    {info.text}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button
                      asChild
                      className="bg-[#b3a369] text-[#003c71] hover:bg-[#b3a369]/90 button-hover"
                    >
                      <a href={info.url1 || "#"}>
                        {info.url1Title || "Join Now"}
                      </a>
                    </Button>
                    <Button
                      asChild
                      className="bg-[#003c71] text-white hover:bg-[#003c71]/90 button-hover"
                    >
                      <a
                        href={info.url2 || "https://rangernet.jesuit.org"}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {info.url2Title || "Visit RangerNet"}
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <EditInfoModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingInfo(null);
        }}
        onSuccess={handleEditSuccess}
        info={editingInfo}
      />
    </>
  );
}
