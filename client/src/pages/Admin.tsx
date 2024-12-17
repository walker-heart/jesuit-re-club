import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UsersTab } from '@/components/admin/UsersTab'
import { PostsTab } from '@/components/admin/PostsTab'
import { ActivityTab } from '@/components/admin/ActivityTab'
import { useAuth } from '@/hooks/useAuth'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent } from '@/components/ui/card'

export function Admin() {
  const auth = useAuth();
  const [activeTab, setActiveTab] = useState("users");

  // Show loading state while auth state is being determined
  if (auth.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Card>
          <CardContent className="p-6">
            <p>Loading...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check for authentication and proper role
  if (!auth.isAuthenticated || !auth.user?.role || !['admin', 'editor'].includes(auth.user.role)) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Card>
          <CardContent className="p-6">
            <Alert variant="destructive">
              <AlertDescription>You must be an admin to access this page</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render admin dashboard for authenticated users with proper role
  return (
    <div className="px-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="w-full border-b">
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="posts">Posts</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>
        <div className="mt-6">
          <TabsContent value="users">
            <UsersTab />
          </TabsContent>
          <TabsContent value="posts">
            <PostsTab />
          </TabsContent>
          <TabsContent value="activity">
            <ActivityTab />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}