'use client'

import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UsersTab } from '@/components/admin/UsersTab'
import { PostsTab } from '@/components/admin/PostsTab'
import { ActivityTab } from '@/components/admin/ActivityTab'
import { useAuth } from '@/hooks/useAuth'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { auth } from '@/lib/firebase/firebase-config'
import { useToast } from "@/hooks/use-toast"

export function Admin() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("users");
  const [events, setEvents] = useState([]);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
      } catch (error) {
        console.error('Error fetching data:', error);
        setError(error.message);
        toast({
          title: "Error",
          description: error.message || "Failed to load data",
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
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-6">
            <Alert variant="destructive">
              <AlertDescription>You must be an admin to access this page</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleEdit = (type, item) => {
    // Implement edit functionality
    console.log(`Editing ${type}:`, item);
  };

  const handleDelete = (type, item) => {
    // Implement delete functionality
    console.log(`Deleting ${type}:`, item);
  };

  return (
    <>
      <div className="container mx-auto py-10">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="posts">Posts</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>
          <TabsContent value="users">
            <UsersTab />
          </TabsContent>
          <TabsContent value="posts">
            <PostsTab />
          </TabsContent>
          <TabsContent value="activity">
            <ActivityTab />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}