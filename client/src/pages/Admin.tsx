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
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState("users");

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card>
          <CardContent className="py-6">
            <div className="flex items-center space-x-2">
              <p>Loading...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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
      <section className="w-full py-12 md:py-24 lg:py-32 bg-[#003c71] text-white">
        <div className="container px-4 md:px-6">
          <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl">
            Admin
          </h1>
        </div>
      </section>
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