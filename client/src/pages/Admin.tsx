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
  const [activeTab, setActiveTab] = useState(user?.role === 'editor' ? "posts" : "users")

  if (!user || (user.role !== 'admin' && user.role !== 'editor')) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-6">
            <Alert variant="destructive">
              <AlertDescription>You must be an admin or editor to access this page</AlertDescription>
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
            {user.role === 'admin' && (
              <>
                <TabsTrigger value="users">Users</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
              </>
            )}
            <TabsTrigger value="posts">Posts</TabsTrigger>
          </TabsList>
          {user.role === 'admin' && (
            <>
              <TabsContent value="users">
                <UsersTab />
              </TabsContent>
              <TabsContent value="activity">
                <ActivityTab />
              </TabsContent>
            </>
          )}
          <TabsContent value="posts">
            <PostsTab />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}