import { useState, useEffect } from "react"
import { FormModal } from "./FormModal"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/hooks/useAuth"
import { useToast } from "@/hooks/use-toast"
import { auth } from "@/lib/firebase/firebase-config"
import { updateUser, createUser } from "@/lib/firebase/users"
import type { FirebaseUser, UserRole } from "@/lib/firebase/types"

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: FirebaseUser | null;
  onSuccess?: () => void;
}

type FormDataType = {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  password: string;
  role: UserRole;
}

export function UserModal({ isOpen, onClose, user, onSuccess }: UserModalProps) {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormDataType>({
    firstName: "",
    lastName: "",
    email: "",
    username: "",
    password: "",
    role: "user"
  });

  // Reset form when modal is opened/closed
  useEffect(() => {
    if (isOpen) {
      if (user) {
        // Editing existing user
        setFormData({
          firstName: user.firstName || "",
          lastName: user.lastName || "",
          email: user.email || "",
          username: user.username || "",
          password: "", // Empty for editing
          role: user.role || "user"
        });
      } else {
        // Creating new user
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          username: "",
          password: "",
          role: "user"
        });
      }
    }
  }, [isOpen, user]);

  const validateForm = (): boolean => {
    if (!formData.firstName.trim()) {
      toast({
        title: "Error",
        description: "First name is required",
        variant: "destructive"
      });
      return false;
    }
    if (!formData.lastName.trim()) {
      toast({
        title: "Error",
        description: "Last name is required",
        variant: "destructive"
      });
      return false;
    }
    if (!formData.email.trim()) {
      toast({
        title: "Error",
        description: "Email is required",
        variant: "destructive"
      });
      return false;
    }
    if (!formData.username.trim()) {
      toast({
        title: "Error",
        description: "Username is required",
        variant: "destructive"
      });
      return false;
    }
    if (!user && !formData.password.trim()) {
      toast({
        title: "Error",
        description: "Password is required for new users",
        variant: "destructive"
      });
      return false;
    }
    if (!formData.role) {
      toast({
        title: "Error",
        description: "Role is required",
        variant: "destructive"
      });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    try {
      const userData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        username: formData.username,
        role: formData.role,
        name: `${formData.firstName} ${formData.lastName}`.trim()
      };

      if (user?.uid) {
        // For updates, send user data to Firestore
        await updateUser(user.uid, userData);
        
        // If password was provided, update it through the API
        if (formData.password) {
          const idToken = await auth.currentUser?.getIdToken();
          if (!idToken) throw new Error('Not authenticated');
          
          const response = await fetch(`/api/admin/users/${user.uid}/update-password`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${idToken}`
            },
            body: JSON.stringify({ password: formData.password })
          });

          if (!response.ok) {
            throw new Error('Failed to update password');
          }
        }
      } else {
        // For new users, create through the API which handles both auth and Firestore
        const idToken = await auth.currentUser?.getIdToken();
        if (!idToken) throw new Error('Not authenticated');

        const response = await fetch('/api/admin/users/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`
          },
          body: JSON.stringify({
            ...userData,
            password: formData.password,
            createdBy: {
              uid: auth.currentUser?.uid,
              email: auth.currentUser?.email,
              firstName: currentUser?.firstName || '',
              lastName: currentUser?.lastName || ''
            }
          })
        });

        if (!response.ok) {
          throw new Error(await response.text());
        }

        const result = await response.json();
        if (!result.success) {
          throw new Error(result.message || 'Failed to create user');
        }
      }

      onSuccess?.();
      onClose();
      toast({
        title: "Success",
        description: user ? "User updated successfully" : "User created successfully"
      });
    } catch (error: any) {
      console.error('Error saving user:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save user",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title={user ? "Edit User" : "Create User"}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
    >
      <div className="space-y-4">
        <div>
          <Label htmlFor="firstName">First Name *</Label>
          <Input
            id="firstName"
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            required
            className="h-8"
          />
        </div>
        <div>
          <Label htmlFor="lastName">Last Name *</Label>
          <Input
            id="lastName"
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            required
            className="h-8"
          />
        </div>
        <div>
          <Label htmlFor="username">Username *</Label>
          <Input
            id="username"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            required
            className="h-8"
          />
        </div>
        <div>
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            className="h-8"
          />
        </div>
        <div>
          <Label htmlFor="password">{user ? "Password (Optional)" : "Password *"}</Label>
          <Input
            id="password"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required={!user}
            placeholder={user ? "Leave blank to keep current password" : ""}
            className="h-8"
          />
        </div>
        <div>
          <Label htmlFor="role">Role *</Label>
          <Select
            value={formData.role}
            onValueChange={(value: UserRole) => setFormData({ ...formData, role: value })}
          >
            <SelectTrigger id="role" className="h-8">
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="user">User</SelectItem>
              <SelectItem value="editor">Editor</SelectItem>
              {currentUser?.role === 'admin' && (
                <SelectItem value="admin">Admin</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
      </div>
    </FormModal>
  );
} 