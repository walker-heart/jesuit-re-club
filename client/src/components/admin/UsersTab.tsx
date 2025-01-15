'use client'

import { useState, useEffect } from 'react'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { UserModal } from '@/components/modals/UserModal'
import { DeleteModal } from '@/components/modals/DeleteModal'
import { fetchUsers, updateUser, deleteUser, createUser, type FirebaseUser } from '@/lib/firebase/users'
import { useToast } from '@/hooks/use-toast'
import { getAuth } from 'firebase/auth'
import { Edit2, Trash2, Plus } from 'lucide-react'

export function UsersTab() {
  const [searchTerm, setSearchTerm] = useState('')
  const [users, setUsers] = useState<FirebaseUser[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<FirebaseUser | null>(null)
  const [deletingUser, setDeletingUser] = useState<FirebaseUser | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  const loadUsers = async () => {
    try {
      setIsLoading(true)
      const fetchedUsers = await fetchUsers()
      setUsers(fetchedUsers)
    } catch (error: any) {
      console.error('Error loading users:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to load users",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateTestUser = async () => {
    const generateRandomString = (length: number = 5) => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
      return Array.from({ length }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
    };

    try {
      const createdUsers = [];
      
      // Create 5 test users
      for (let i = 0; i < 5; i++) {
        const firstName = generateRandomString();
        const lastName = generateRandomString();
        const username = `${firstName.toLowerCase()}${lastName.toLowerCase()}`;
        
        const userData = {
          email: `${username}@test.com`,
          password: `Test123!`,
          name: `${firstName} ${lastName}`,
          firstName,
          lastName,
          username,
          role: 'test' as const,
        };

        try {
          const idToken = await getAuth().currentUser?.getIdToken();
          if (!idToken) {
            throw new Error('Not authenticated');
          }

          // Create user through the backend API
          const response = await fetch('/api/admin/users/create', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${idToken}`
            },
            body: JSON.stringify(userData)
          });

          if (!response.ok) {
            throw new Error(await response.text());
          }

          const result = await response.json();
          if (result.success && result.user) {
            createdUsers.push(userData.name);
            setUsers(prevUsers => [...prevUsers, result.user]);
          }
        } catch (error: any) {
          console.error(`Failed to create user ${userData.name}:`, error);
          toast({
            title: "Error",
            description: `Failed to create ${userData.name}: ${error.message}`,
            variant: "destructive"
          });
        }
      }

      if (createdUsers.length > 0) {
        toast({
          title: "Success",
          description: `Created ${createdUsers.length} test users`
        });
        // Refresh the user list to ensure we have the latest data
        await loadUsers();
      }
    } catch (error: any) {
      console.error('Error in test user creation process:', error);
      toast({
        title: "Error",
        description: "Failed to complete test user creation process",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = users.filter(user => {
    const username = user.username || '';
    const email = user.email || '';
    const searchLower = searchTerm.toLowerCase();
    return username.toLowerCase().includes(searchLower) || 
           email.toLowerCase().includes(searchLower);
  });

  const handleCreateUser = () => {
    setEditingUser(null)
    setIsModalOpen(true)
  }

  const handleEditUser = (user: FirebaseUser) => {
    setEditingUser(user)
    setIsModalOpen(true)
  }

  const handleDeleteUser = async (user: FirebaseUser) => {
    setDeletingUser(user)
    setIsDeleteModalOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!deletingUser?.uid) return;
    
    try {
      setIsDeleting(true)
      await deleteUser(deletingUser.uid)
      setUsers(users.filter(user => user.uid !== deletingUser.uid))
      toast({
        title: "Success",
        description: "User deleted successfully"
      })
    } catch (error: any) {
      console.error('Error deleting user:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive"
      })
    } finally {
      setIsDeleting(false)
      setIsDeleteModalOpen(false)
      setDeletingUser(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Input
          type="text"
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <div className="flex gap-4 mb-4">
          <Button 
            onClick={handleCreateUser}
            className="bg-[#003c71] hover:bg-[#002855] text-white"
          >
            Create User
          </Button>
          <Button 
            onClick={handleCreateTestUser}
            className="bg-[#003c71] hover:bg-[#002855] text-white"
          >
            Create Test User
          </Button>
        </div>
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Last Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <div className="flex items-center justify-center text-sm text-muted-foreground">
                    Loading users...
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <div className="flex flex-col items-center justify-center text-sm text-muted-foreground">
                    <p>No users found</p>
                    {searchTerm && <p className="mt-1">Try adjusting your search</p>}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.uid}>
                  <TableCell className="font-medium">{user.name || user.username || 'No name'}</TableCell>
                  <TableCell>{user.email || 'N/A'}</TableCell>
                  <TableCell className="capitalize">{user.role || 'user'}</TableCell>
                  <TableCell>
                    {user.createdAt && !isNaN(new Date(user.createdAt).getTime())
                      ? new Date(user.createdAt).toLocaleString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true
                        })
                      : 'N/A'}
                  </TableCell>
                  <TableCell>
                    {user.updatedAt && !isNaN(new Date(user.updatedAt).getTime())
                      ? new Date(user.updatedAt).toLocaleString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true
                        })
                      : 'N/A'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleEditUser(user)}
                      className="mr-2"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDeleteUser(user)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <UserModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingUser(null)
        }}
        user={editingUser}
        onSuccess={loadUsers}
      />

      <DeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false)
          setDeletingUser(null)
        }}
        onConfirm={handleConfirmDelete}
        title="Delete User"
        message={`Are you sure you want to delete ${deletingUser?.name || deletingUser?.username || 'this user'}? This action cannot be undone.`}
        isDeleting={isDeleting}
      />
    </div>
  );
}