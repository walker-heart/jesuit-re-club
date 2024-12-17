import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UsersTab } from '@/components/admin/UsersTab';
import { PostsTab } from '@/components/admin/PostsTab';
import { ActivityTab } from '@/components/admin/ActivityTab';

export function Admin() {
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("users");

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  if (!user || (user.role !== 'admin' && user.role !== 'editor')) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-4xl font-bold text-red-500">Access Denied</h1>
        <p className="mt-4">You do not have permission to access this page.</p>
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
