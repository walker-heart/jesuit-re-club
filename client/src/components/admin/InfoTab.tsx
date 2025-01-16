import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUp, ArrowDown, Edit2 } from "lucide-react";
import { EditInfoModal } from "@/components/modals/EditInfoModal";
import { fetchInfo, updateInfo } from "@/lib/firebase/info";
import type { FirebaseInfo } from "@/lib/firebase/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";

export function InfoTab() {
  const { user } = useAuth();
  const [aboutContent, setAboutContent] = useState<FirebaseInfo[]>([]);
  const [membershipTopContent, setMembershipTopContent] = useState<FirebaseInfo[]>([]);
  const [membershipBottomContent, setMembershipBottomContent] = useState<FirebaseInfo[]>([]);
  const [editingInfo, setEditingInfo] = useState<FirebaseInfo | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    try {
      const aboutInfo = await fetchInfo('aboutus');
      const membershipTop = await fetchInfo('membership', 'top');
      const membershipBottom = await fetchInfo('membership', 'bottom');
      
      setAboutContent(aboutInfo);
      setMembershipTopContent(membershipTop);
      setMembershipBottomContent(membershipBottom);
    } catch (error) {
      console.error('Error loading info:', error);
    }
  };

  const handleEditClick = (info: FirebaseInfo) => {
    setEditingInfo(info);
    setIsEditModalOpen(true);
  };

  const handleEditSuccess = () => {
    loadContent();
    setIsEditModalOpen(false);
    setEditingInfo(null);
  };

  const handleReorder = async (
    section: 'aboutus' | 'membership',
    type: string | undefined,
    currentIndex: number,
    direction: 'up' | 'down'
  ) => {
    let content: FirebaseInfo[];
    let setContent: (content: FirebaseInfo[]) => void;

    if (section === 'aboutus') {
      content = [...aboutContent];
      setContent = setAboutContent;
    } else if (type === 'top') {
      content = [...membershipTopContent];
      setContent = setMembershipTopContent;
    } else {
      content = [...membershipBottomContent];
      setContent = setMembershipBottomContent;
    }

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= content.length) return;

    // Swap items in the array
    [content[currentIndex], content[newIndex]] = [content[newIndex], content[currentIndex]];
    
    // Update the state immediately for smooth UI
    setContent(content);

    // Update the order in the database
    try {
      if (!user) return;
      
      const item1 = content[currentIndex];
      const item2 = content[newIndex];
      
      await Promise.all([
        updateInfo(item1.id, { order: currentIndex }, user),
        updateInfo(item2.id, { order: newIndex }, user)
      ]);
    } catch (error) {
      console.error('Error updating order:', error);
      // Reload content to ensure sync with database
      await loadContent();
    }
  };

  const renderContent = (content: FirebaseInfo[], section: 'aboutus' | 'membership', type?: string) => (
    <Card className="border border-gray-200 shadow-sm">
      <CardContent className="p-6">
        <div className="grid gap-4">
          {content.map((info, index) => (
            <Card key={info.id} className="relative border border-gray-200 hover:border-gray-300 transition-colors">
              <CardHeader className="p-4">
                <CardTitle className="flex items-center justify-between text-lg">
                  <span>{info.title}</span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      disabled={index === 0}
                      onClick={() => handleReorder(section, type, index, 'up')}
                      className="h-8 w-8"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      disabled={index === content.length - 1}
                      onClick={() => handleReorder(section, type, index, 'down')}
                      className="h-8 w-8"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleEditClick(info)}
                      className="h-8 w-8"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-gray-600">{info.text}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <Card className="border border-gray-200 shadow-sm">
        <CardContent className="p-6">
          <Tabs defaultValue="about" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="about">About Us</TabsTrigger>
              <TabsTrigger value="membership">Membership</TabsTrigger>
            </TabsList>
            
            <TabsContent value="about" className="space-y-4">
              <h2 className="text-2xl font-bold text-[#003c71]">About Us Content</h2>
              {renderContent(aboutContent, 'aboutus')}
            </TabsContent>
            
            <TabsContent value="membership">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold text-[#003c71]">Top Content</h2>
                  {renderContent(membershipTopContent, 'membership', 'top')}
                </div>
                
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold text-[#003c71]">Bottom Content</h2>
                  {renderContent(membershipBottomContent, 'membership', 'bottom')}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {editingInfo && (
        <EditInfoModal
          info={editingInfo}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  );
} 