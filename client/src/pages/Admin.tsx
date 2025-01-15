'use client'

import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UsersTab } from '@/components/admin/UsersTab'
import { PostsTab } from '@/components/admin/PostsTab'
import { NewsTab } from '@/components/admin/NewsTab'
import { FilesTab } from '@/components/admin/FilesTab'
import { PhotoGalleryTab } from '@/components/admin/PhotoGalleryTab'
import { useAuth } from '@/hooks/useAuth'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { auth } from '@/lib/firebase/firebase-config'
import { useToast } from "@/hooks/use-toast"

export function Admin() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState(() => {
    // Get initial tab from URL hash or default to "users"
    const hash = window.location.hash.replace('#', '');
    return ['users', 'posts', 'files', 'gallery', 'activity'].includes(hash) ? hash : 'users';
  });
  const [events, setEvents] = useState([]);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Update URL hash when tab changes
  useEffect(() => {
    window.location.hash = activeTab;
  }, [activeTab]);

  // Listen for hash changes
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (['users', 'posts', 'files', 'gallery', 'activity'].includes(hash)) {
        setActiveTab(hash);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!auth.currentUser) return;
      
      try {
        setLoading(true);
        const idToken = await auth.currentUser.getIdToken();
        
        // Fetch events
        const eventsResponse = await fetch('/api/events', {
          headers: {
            'Authorization': `Bearer ${idToken}`,
            'Accept': 'application/json'
          }
        });
        
        // Fetch resources
        const resourcesResponse = await fetch('/api/admin/resources', {
          headers: {
            'Authorization': `Bearer ${idToken}`,
            'Accept': 'application/json'
          }
        });

        if (!eventsResponse.ok || !resourcesResponse.ok) {
          throw new Error('Failed to fetch data');
        }

        const eventsData = await eventsResponse.json();
        const resourcesData = await resourcesResponse.json();

        if (eventsData.success && Array.isArray(eventsData.events)) {
          setEvents(eventsData.events);
        }

        if (resourcesData.success && Array.isArray(resourcesData.resources)) {
          setResources(resourcesData.resources);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
        setError(errorMessage);
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  if (!user || user.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="bg-red-100/80 rounded-lg p-8 max-w-md w-full mx-4">
          <h2 className="text-3xl font-bold text-red-600 mb-4">Access Denied</h2>
          <p className="text-red-600 text-lg">You must be an admin to view this page</p>
        </div>
      </div>
    );
  }

  const handleEdit = (type: string, item: unknown) => {
    // Implement edit functionality
    console.log(`Editing ${type}:`, item);
  };

  const handleDelete = (type: string, item: unknown) => {
    // Implement delete functionality
    console.log(`Deleting ${type}:`, item);
  };

  return (
    <>
      <div className="container mx-auto py-10">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="posts">Posts</TabsTrigger>
            <TabsTrigger value="files">Files</TabsTrigger>
            <TabsTrigger value="gallery">Photo Gallery</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>
          <TabsContent value="users">
            <UsersTab />
          </TabsContent>
          <TabsContent value="posts">
            <PostsTab />
          </TabsContent>
          <TabsContent value="files">
            <FilesTab />
          </TabsContent>
          <TabsContent value="gallery">
            <PhotoGalleryTab />
          </TabsContent>
          <TabsContent value="activity">
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground">Coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}