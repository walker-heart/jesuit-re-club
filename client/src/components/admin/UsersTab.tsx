'use client'

import { useState, useEffect } from 'react'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { UserModal } from '@/components/admin/UserModal'
import { fetchUsers, updateUser, deleteUser, type FirebaseUser } from '@/lib/firebase/users'
import { useToast } from '@/hooks/use-toast'

export function UsersTab() {
  const [searchTerm, setSearchTerm] = useState('')
  const [users, setUsers] = useState<FirebaseUser[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<FirebaseUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    loadUsers()
  }, [])

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

  const filteredUsers = users.filter(user =>
    user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleCreateUser = () => {
    setEditingUser(null)
    setIsModalOpen(true)
  }

  const handleEditUser = (user: FirebaseUser) => {
    setEditingUser(user)
    setIsModalOpen(true)
  }

  const handleSaveUser = async (user: FirebaseUser) => {
    try {
      if (editingUser) {
        await updateUser(user.uid, user)
        setUsers(users.map(u => u.uid === user.uid ? user : u))
        toast({
          title: "Success",
          description: "User updated successfully"
        })
      }
      setIsModalOpen(false)
      // Reload users to ensure we have the latest data
      loadUsers()
    } catch (error: any) {
      console.error('Error saving user:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to save user",
        variant: "destructive"
      })
    }
  }

  const handleDeleteUser = async (uid: string) => {
    try {
      await deleteUser(uid)
      setUsers(users.filter(user => user.uid !== uid))
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
        <Button onClick={handleCreateUser}>Create User</Button>
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <div className="flex items-center justify-center text-sm text-muted-foreground">
                    Loading users...
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <div className="flex flex-col items-center justify-center text-sm text-muted-foreground">
                    <p>No users found</p>
                    {searchTerm && <p className="mt-1">Try adjusting your search</p>}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.uid}>
                  <TableCell className="font-medium">{user.displayName}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell className="capitalize">{user.role}</TableCell>
                  <TableCell>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      className="mr-2"
                      onClick={() => handleEditUser(user)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteUser(user.uid)}
                    >
                      Delete
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
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveUser}
        user={editingUser}
      />
    </div>
  );
}
