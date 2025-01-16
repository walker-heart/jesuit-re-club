'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EditorEventsTab } from '@/components/editor/EditorEventsTab'
import { EditorResourcesTab } from '@/components/editor/EditorResourcesTab'
import { EditorNewsTab } from '@/components/editor/EditorNewsTab'
import { EditorFilesTab } from '@/components/editor/EditorFilesTab'
import { useAuth } from '@/hooks/useAuth'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent } from '@/components/ui/card'

export function EditorDashboard() {
  const { user } = useAuth();

  if (!user || (user.role !== 'admin' && user.role !== 'editor')) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="bg-red-100/80 rounded-lg p-8 max-w-md w-full mx-4">
          <h2 className="text-3xl font-bold text-red-600 mb-4">Access Denied</h2>
          <p className="text-red-600 text-lg">You must be an editor to view this page</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <Tabs defaultValue="events">
        <TabsList>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="news">News</TabsTrigger>
          <TabsTrigger value="files">Files</TabsTrigger>
        </TabsList>
        <TabsContent value="events">
          <EditorEventsTab />
        </TabsContent>
        <TabsContent value="resources">
          <EditorResourcesTab />
        </TabsContent>
        <TabsContent value="news">
          <EditorNewsTab />
        </TabsContent>
        <TabsContent value="files">
          <EditorFilesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
