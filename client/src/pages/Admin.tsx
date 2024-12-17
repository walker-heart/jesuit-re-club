'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UsersTab } from '@/components/admin/UsersTab'
import { PostsTab } from '@/components/admin/PostsTab'
import { ActivityTab } from '@/components/admin/ActivityTab'
import { useAuth } from '@/hooks/useAuth'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent } from '@/components/ui/card'

export function Admin() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("users")

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