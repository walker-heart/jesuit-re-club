'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EditorEventsTab } from '@/components/editor/EditorEventsTab'
import { EditorResourcesTab } from '@/components/editor/EditorResourcesTab'
import { EditorNewsTab } from '@/components/editor/EditorNewsTab'
import { useAuth } from '@/hooks/useAuth'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent } from '@/components/ui/card'

export function EditorDashboard() {
  const { user } = useAuth();

  if (!user || (user.role !== 'admin' && user.role !== 'editor')) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-6">
            <Alert variant="destructive">
              <AlertDescription>You must be an editor to access this page</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
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
      </Tabs>
    </div>
  );
}
