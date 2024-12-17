'use client'

import { useState } from 'react'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { UserModal } from '@/components/admin/UserModal'

type UserItem = {
  id: number;
  username: string;
  email: string;
  password: string;
  role: 'admin' | 'editor' | 'user';
}

// Mock user data
const mockUsers: UserItem[] = [
  { id: 1, username: 'johndoe', email: 'john@example.com', password: 'password123', role: 'admin' },
  { id: 2, username: 'janesmith', email: 'jane@example.com', password: 'password456', role: 'editor' },
  { id: 3, username: 'bobjohnson', email: 'bob@example.com', password: 'password789', role: 'user' },
]

export function UsersTab() {
  const [searchTerm, setSearchTerm] = useState('')
  const [users, setUsers] = useState(mockUsers)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<UserItem | null>(null)

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleCreateUser = () => {
    setEditingUser(null)
    setIsModalOpen(true)
  }

  const handleEditUser = (user: UserItem) => {
    setEditingUser(user)
    setIsModalOpen(true)
  }

  const handleSaveUser = (user: UserItem) => {
    if (user.id === 0) {
      // Create new user
      const newUser = { ...user, id: users.length + 1 }
      setUsers([...users, newUser])
    } else {
      // Update existing user
      setUsers(users.map(u => u.id === user.id ? user : u))
    }
  }

  const handleDeleteUser = (id: number) => {
    setUsers(users.filter(user => user.id !== id))
  }

  return (
    <div>
      <div className="flex justify-between mb-4">
        <Input
          type="text"
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Button onClick={handleCreateUser}>Create User</Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Username</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredUsers.map((user) => (
            <TableRow key={user.id}>
              <TableCell>{user.username}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>{user.role}</TableCell>
              <TableCell>
                <Button variant="outline" size="sm" className="mr-2" onClick={() => handleEditUser(user)}>Edit</Button>
                <Button variant="destructive" size="sm" onClick={() => handleDeleteUser(user.id)}>Delete</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <UserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveUser}
        user={editingUser}
      />
    </div>
  )
}
