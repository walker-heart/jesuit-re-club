import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/use-toast'
import { auth } from '@/lib/firebase'
import { type FirebaseUser, type UserRole } from '@/lib/firebase/types'

type UserFormData = {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  password: string;
  role: UserRole;
}

type UserModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (user: FirebaseUser) => void;
  user: FirebaseUser | null;
}

export function UserModal({ isOpen, onClose, onSave, user }: UserModalProps) {
  const [editedUser, setEditedUser] = useState<UserFormData>({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    role: 'user'
  });
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      setEditedUser({
        uid: user.uid,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        username: user.username || '',
        email: user.email || '',
        password: '',
        role: user.role || 'user'
      });
    } else {
      setEditedUser({
        firstName: '',
        lastName: '',
        username: '',
        email: '',
        password: '',
        role: 'user'
      });
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditedUser(prev => ({ ...prev, [name]: value }));
  };

  const handleRoleChange = (value: string) => {
    setEditedUser(prev => ({ ...prev, role: value as 'admin' | 'editor' | 'user' }));
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error('Not authenticated');

      if (user) {
        // Updating existing user
        const updateData = {
          firstName: editedUser.firstName,
          lastName: editedUser.lastName,
          username: editedUser.username,
          email: editedUser.email,
          role: editedUser.role
        };

        // Only include password if it was changed
        if (editedUser.password) {
          updateData.password = editedUser.password;
        }

        const response = await fetch(`/api/admin/users/${user.uid}/update`, {
          method: 'PUT',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(updateData)
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || 'Failed to update user');
        }

        // Call onSave with the updated user data
        onSave({
          ...user,
          ...updateData
        });
      } else {
        // Creating new user
        console.log('Sending create user request with data:', {
          firstName: editedUser.firstName,
          lastName: editedUser.lastName,
          username: editedUser.username,
          email: editedUser.email,
          role: editedUser.role
        });

        // Call the admin endpoint to create user
        const response = await fetch('/api/admin/users/create', {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            firstName: editedUser.firstName,
            lastName: editedUser.lastName,
            username: editedUser.username,
            email: editedUser.email,
            password: editedUser.password,
            role: editedUser.role
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || 'Failed to create user');
        }

        const data = await response.json();

        // Update the local state with the new user data
        const newUser: FirebaseUser = {
          uid: data.user.uid,
          firstName: editedUser.firstName,
          lastName: editedUser.lastName,
          name: `${editedUser.firstName} ${editedUser.lastName}`.trim(),
          username: editedUser.username,
          email: editedUser.email,
          role: editedUser.role,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        onSave(newUser);
        onClose();
      }

      toast({
        title: "Success",
        description: user ? "User updated successfully" : "User created successfully"
      });
    } catch (error: any) {
      console.error('Error saving user:', error);
      toast({
        title: "Error",
        description: error.message || 'Failed to save user',
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{user ? 'Edit User' : 'Create User'}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="firstName" className="text-right">First Name</Label>
            <Input
              id="firstName"
              name="firstName"
              value={editedUser.firstName}
              onChange={handleInputChange}
              className="col-span-3"
              required
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="lastName" className="text-right">Last Name</Label>
            <Input
              id="lastName"
              name="lastName"
              value={editedUser.lastName}
              onChange={handleInputChange}
              className="col-span-3"
              required
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="username" className="text-right">Username</Label>
            <Input
              id="username"
              name="username"
              value={editedUser.username}
              onChange={handleInputChange}
              className="col-span-3"
              required
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={editedUser.email}
              onChange={handleInputChange}
              className="col-span-3"
              required
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="password" className="text-right">
              {user ? 'New Password' : 'Password'}
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              value={editedUser.password}
              onChange={handleInputChange}
              className="col-span-3"
              required={!user}
              minLength={6}
              placeholder={user ? "Leave blank to keep current password" : "Enter password"}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="role" className="text-right">Role</Label>
            <Select value={editedUser.role} onValueChange={handleRoleChange}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="editor">Editor</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button 
            onClick={handleSave} 
            disabled={isSubmitting}
            className="bg-[#003c71] hover:bg-[#002855] text-white"
          >
            {isSubmitting ? 'Creating...' : user ? 'Save' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
