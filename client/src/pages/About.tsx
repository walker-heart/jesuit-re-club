import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';

export function About() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [content, setContent] = useState({
    mission: '',
    vision: '',
    values: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(content);

  useEffect(() => {
    const fetchContent = async () => {
      const docRef = doc(db, 'settings', 'about');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setContent(docSnap.data() as typeof content);
        setEditContent(docSnap.data() as typeof content);
      }
    };

    fetchContent();
  }, []);

  const handleSave = async () => {
    try {
      await setDoc(doc(db, 'settings', 'about'), editContent);
      setContent(editContent);
      setIsEditing(false);
      toast({
        title: "Success",
        description: "About content updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update content",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold text-center mb-12">About Us</h1>

      {user?.role === 'admin' && (
        <div className="mb-8 flex justify-end">
          {isEditing ? (
            <div className="space-x-4">
              <Button onClick={handleSave}>Save Changes</Button>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
            </div>
          ) : (
            <Button onClick={() => setIsEditing(true)}>Edit Content</Button>
          )}
        </div>
      )}

      <div className="grid gap-8">
        <Card>
          <CardContent className="pt-6">
            <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
            {isEditing ? (
              <Textarea
                value={editContent.mission}
                onChange={(e) => setEditContent({
                  ...editContent,
                  mission: e.target.value
                })}
                className="min-h-[150px]"
              />
            ) : (
              <p className="whitespace-pre-wrap">{content.mission}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <h2 className="text-2xl font-bold mb-4">Our Vision</h2>
            {isEditing ? (
              <Textarea
                value={editContent.vision}
                onChange={(e) => setEditContent({
                  ...editContent,
                  vision: e.target.value
                })}
                className="min-h-[150px]"
              />
            ) : (
              <p className="whitespace-pre-wrap">{content.vision}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <h2 className="text-2xl font-bold mb-4">Our Values</h2>
            {isEditing ? (
              <Textarea
                value={editContent.values}
                onChange={(e) => setEditContent({
                  ...editContent,
                  values: e.target.value
                })}
                className="min-h-[150px]"
              />
            ) : (
              <p className="whitespace-pre-wrap">{content.values}</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
