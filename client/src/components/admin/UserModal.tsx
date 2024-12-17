import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/use-toast'
import { getAuth } from 'firebase/auth'

import { type FirebaseUser } from '@/lib/firebase/users';

type UserFormData = {
  uid?: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
  role: 'admin' | 'editor' | 'user';
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
    // Check all required fields
    const requiredFields = [
      { field: 'firstName', label: 'First Name' },
      { field: 'lastName', label: 'Last Name' },
      { field: 'username', label: 'Username' },
      { field: 'email', label: 'Email' },
      { field: 'password', label: 'Password' }
    ];

    const missingFields = requiredFields
      .filter(({ field }) => !editedUser[field])
      .map(({ label }) => label);

    if (missingFields.length > 0) {
      toast({
        title: "Validation Error",
        description: `Please fill in the following required fields: ${missingFields.join(', ')}`,
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      if (!user) {
        // Get the current user's ID token
        const auth = getAuth();
        const currentUser = auth.currentUser;
        if (!currentUser) {
          throw new Error('Not authenticated');
        }
        const token = await currentUser.getIdToken();

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

        const responseText = await response.text();
        console.log('Raw response:', responseText);

        let data;
        try {
          data = JSON.parse(responseText);
          console.log('Parsed response:', data);
        } catch (error) {
          console.error('Failed to parse response:', error);
          throw new Error('Invalid server response');
        }

        if (!response.ok || !data.success) {
          throw new Error(data?.message || 'Failed to create user');
        }

        if (!data.user) {
          throw new Error('Invalid response format from server');
        }

        toast({
          title: "Success",
          description: data.message || "User created successfully",
        });

        // Update the local state with the new user data
        const newUser: FirebaseUser = {
          uid: data.user.uid,
          firstName: editedUser.firstName,
          lastName: editedUser.lastName,
          username: editedUser.username,
          email: editedUser.email,
          role: editedUser.role,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        onSave(newUser);
        onClose();
      }
    } catch (error: any) {
      console.error('User creation error:', error);
      toast({
        title: "Error",
        description: error.message || 'Failed to create user',
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
            <Label htmlFor="password" className="text-right">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              value={editedUser.password}
              onChange={handleInputChange}
              className="col-span-3"
              required
              minLength={6}
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
          >
            {isSubmitting ? 'Creating...' : user ? 'Save' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
