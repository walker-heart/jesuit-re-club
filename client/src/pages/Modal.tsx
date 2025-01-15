import { useState, useEffect } from "react"
import { useLocation } from "wouter"
import { Button } from "@/components/ui/button"
import { BaseModal } from "@/components/modals/BaseModal"
import { FormModal } from "@/components/modals/FormModal"
import { DeleteModal } from "@/components/modals/DeleteModal"
import { EventModal } from "@/components/modals/EventModal"
import { NewsModal } from "@/components/modals/NewsModal"
import { ResourceModal } from "@/components/modals/ResourceModal"
import { UserModal } from "@/components/modals/UserModal"
import { EditInfoModal } from "@/components/modals/EditInfoModal"
import { Card } from "@/components/ui/card"
import { Plus, Edit2, Trash2 } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { useToast } from "@/hooks/use-toast"
import { FirebaseUser, FirebaseInfo } from "@/lib/firebase/types"

export default function ModalShowcase() {
  const { user } = useAuth();
  const { toast } = useToast();

  // Base Modal State
  const [isBaseModalOpen, setIsBaseModalOpen] = useState(false)

  // Form Modal State
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [isFormSubmitting, setIsFormSubmitting] = useState(false)
  const [isFormEditMode, setIsFormEditMode] = useState(false)

  // Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Event Modal State
  const [isEventModalOpen, setIsEventModalOpen] = useState(false)
  const [isEventEditMode, setIsEventEditMode] = useState(false)

  // News Modal State
  const [isNewsModalOpen, setIsNewsModalOpen] = useState(false)
  const [isNewsEditMode, setIsNewsEditMode] = useState(false)

  // Resource Modal State
  const [isResourceModalOpen, setIsResourceModalOpen] = useState(false)
  const [isResourceEditMode, setIsResourceEditMode] = useState(false)

  // User Modal State
  const [isUserModalOpen, setIsUserModalOpen] = useState(false)
  const [isUserEditMode, setIsUserEditMode] = useState(false)

  // Edit Info Modal State
  const [isEditInfoModalOpen, setIsEditInfoModalOpen] = useState(false);
  const [isEditInfoEditMode, setIsEditInfoEditMode] = useState(false);

  // Check for admin role
  if (!user || user.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="bg-red-100/80 rounded-lg p-8 max-w-md w-full mx-4">
          <h2 className="text-3xl font-bold text-red-600 mb-4">Access Denied</h2>
          <p className="text-red-600 text-lg">You must be an admin to view this page</p>
        </div>
      </div>
    );
  }

  // Mock form submit handler
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsFormSubmitting(true)
    await new Promise(resolve => setTimeout(resolve, 2000))
    setIsFormSubmitting(false)
    setIsFormModalOpen(false)
  }

  // Mock delete handler
  const handleDelete = async () => {
    setIsDeleting(true)
    await new Promise(resolve => setTimeout(resolve, 2000))
    setIsDeleting(false)
    setIsDeleteModalOpen(false)
  }

  // Mock success handler
  const handleSuccess = async () => {
    toast({
      title: "Success",
      description: "Operation completed successfully"
    });
  };

  // Mock handlers for specific modals
  const handleEventSave = async () => {
    await new Promise(resolve => setTimeout(resolve, 2000))
    setIsEventModalOpen(false)
  }

  const handleNewsSave = async () => {
    await new Promise(resolve => setTimeout(resolve, 2000))
    setIsNewsModalOpen(false)
  }

  const handleResourceSave = async () => {
    await new Promise(resolve => setTimeout(resolve, 2000))
    setIsResourceModalOpen(false)
  }

  const handleUserSave = async () => {
    await new Promise(resolve => setTimeout(resolve, 2000))
    setIsUserModalOpen(false)
  }

  // Mock data for edit examples
  const mockUserInfo = {
    uid: 'user123',
    email: 'john@example.com',
    displayName: 'John Doe',
    firstName: 'John',
    lastName: 'Doe'
  }

  const mockEvent = {
    id: '1',
    title: 'Sample Event',
    slug: 'sample-event',
    date: '2024-03-01',
    time: '14:00',
    location: 'Main Hall',
    speaker: 'John Doe',
    speakerDescription: 'Expert in the field',
    agenda: 'Sample agenda',
    url: 'https://example.com/event',
    userId: 'user123',
    createdBy: mockUserInfo,
    createdAt: new Date().toISOString(),
    updatedBy: mockUserInfo,
    updatedAt: new Date().toISOString()
  }

  const mockNews = {
    id: '1',
    title: 'Sample News',
    slug: 'sample-news',
    content: 'Sample content',
    date: new Date().toISOString(),
    imageUrl: '',
    tags: ['news'],
    isPublished: false,
    userId: 'user123',
    createdBy: mockUserInfo,
    createdAt: new Date().toISOString(),
    updatedBy: mockUserInfo,
    updatedAt: new Date().toISOString()
  }

  const mockResource = {
    id: '1',
    title: 'Sample Resource',
    description: 'Sample description',
    numberOfTexts: 1,
    textFields: ['Sample text'],
    userId: 'user123',
    createdBy: mockUserInfo,
    createdAt: new Date().toISOString(),
    updatedBy: mockUserInfo,
    updatedAt: new Date().toISOString()
  }

  const mockUser = {
    uid: 'user123',
    firstName: 'John',
    lastName: 'Doe',
    name: 'John Doe',
    username: 'johndoe',
    email: 'john@example.com',
    role: 'user' as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }

  // Mock handlers for specific modals
  const handleEventOpen = (editMode: boolean) => {
    setIsEventEditMode(editMode)
    setIsEventModalOpen(true)
  }

  const handleNewsOpen = (editMode: boolean) => {
    setIsNewsEditMode(editMode)
    setIsNewsModalOpen(true)
  }

  const handleResourceOpen = (editMode: boolean) => {
    setIsResourceEditMode(editMode)
    setIsResourceModalOpen(true)
  }

  const handleUserOpen = (editMode: boolean) => {
    setIsUserEditMode(editMode)
    setIsUserModalOpen(true)
  }

  const handleFormOpen = (editMode: boolean) => {
    setIsFormEditMode(editMode)
    setIsFormModalOpen(true)
  }

  const mockFirebaseUser: FirebaseUser = {
    uid: 'user123',
    email: 'user@example.com',
    firstName: 'John',
    lastName: 'Doe',
    name: 'John Doe',
    username: 'johndoe',
    role: 'admin',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const mockInfo: FirebaseInfo = {
    id: '1',
    title: 'Sample Info',
    icon: 'building',
    text: 'Sample text content',
    userId: 'user123',
    createdBy: mockFirebaseUser,
    createdAt: new Date().toISOString(),
    updatedBy: mockFirebaseUser,
    updatedAt: new Date().toISOString()
  };

  const handleEditInfoOpen = (editMode: boolean) => {
    setIsEditInfoEditMode(editMode);
    setIsEditInfoModalOpen(true);
  };

  return (
    <div className="container max-w-7xl py-10">
      <h1 className="text-4xl font-bold mb-8">Modal Showcase</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Edit Info Modal */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Edit Info Modal</h2>
          <p className="text-gray-600 mb-4">A modal for editing information with title, icon, and text fields.</p>
          <div className="flex gap-2">
            <Button onClick={() => handleEditInfoOpen(false)} className="text-white">
              <Plus className="h-4 w-4 mr-2" />
              Create Info
            </Button>
            <Button 
              onClick={() => handleEditInfoOpen(true)} 
              variant="outline"
              size="icon"
              className="border-[#003c71] text-[#003c71] hover:bg-[#003c71] hover:text-white"
            >
              <Edit2 className="h-4 w-4" />
            </Button>
          </div>
          <EditInfoModal
            isOpen={isEditInfoModalOpen}
            onClose={() => {
              setIsEditInfoModalOpen(false);
              setIsEditInfoEditMode(false);
            }}
            info={isEditInfoEditMode ? mockInfo : null}
            onSuccess={handleSuccess}
          />
        </Card>

        {/* Base Modal */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Base Modal</h2>
          <p className="text-gray-600 mb-4">A simple modal with a title and content.</p>
          <Button onClick={() => setIsBaseModalOpen(true)} className="text-white">
            <Plus className="h-4 w-4 mr-2" />
            Create Modal
          </Button>
          <BaseModal
            isOpen={isBaseModalOpen}
            onClose={() => setIsBaseModalOpen(false)}
            title="Base Modal Example"
          >
            <div className="p-4">
              <p>This is a basic modal with just a title and content area.</p>
            </div>
          </BaseModal>
        </Card>

        {/* Form Modal */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Form Modal</h2>
          <p className="text-gray-600 mb-4">A modal with a form and submit/cancel buttons.</p>
          <div className="flex gap-2">
            <Button onClick={() => handleFormOpen(false)} className="text-white">
              <Plus className="h-4 w-4 mr-2" />
              Create Form
            </Button>
            <Button 
              onClick={() => handleFormOpen(true)} 
              variant="outline"
              size="icon"
              className="border-[#003c71] text-[#003c71] hover:bg-[#003c71] hover:text-white"
            >
              <Edit2 className="h-4 w-4" />
            </Button>
          </div>
          <FormModal
            isOpen={isFormModalOpen}
            onClose={() => setIsFormModalOpen(false)}
            title="Form Modal Example"
            onSubmit={handleFormSubmit}
            isSubmitting={isFormSubmitting}
          >
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Sample Input</label>
                <input type="text" className="w-full border rounded p-2" />
              </div>
            </div>
          </FormModal>
        </Card>

        {/* Delete Modal */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Delete Modal</h2>
          <p className="text-gray-600 mb-4">A confirmation modal for delete operations.</p>
          <Button variant="destructive" onClick={() => setIsDeleteModalOpen(true)} size="icon">
            <Trash2 className="h-4 w-4" />
          </Button>
          <DeleteModal
            isOpen={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
            onConfirm={handleDelete}
            isDeleting={isDeleting}
          />
        </Card>

        {/* Event Modal */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Event Modal</h2>
          <p className="text-gray-600 mb-4">A modal for creating/editing events with optional URL and link.</p>
          <div className="flex gap-2">
            <Button onClick={() => handleEventOpen(false)} className="text-white">
              <Plus className="h-4 w-4 mr-2" />
              Create Event
            </Button>
            <Button 
              onClick={() => handleEventOpen(true)} 
              variant="outline"
              size="icon"
              className="border-[#003c71] text-[#003c71] hover:bg-[#003c71] hover:text-white"
            >
              <Edit2 className="h-4 w-4" />
            </Button>
          </div>
          <EventModal
            isOpen={isEventModalOpen}
            onClose={() => {
              setIsEventModalOpen(false);
              setIsEventEditMode(false);
            }}
            event={isEventEditMode ? mockEvent : null}
            onSuccess={handleSuccess}
          />
        </Card>

        {/* News Modal */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">News Modal</h2>
          <p className="text-gray-600 mb-4">A modal for creating/editing news articles with auto-generated dates.</p>
          <div className="flex gap-2">
            <Button onClick={() => handleNewsOpen(false)} className="text-white">
              <Plus className="h-4 w-4 mr-2" />
              Create News
            </Button>
            <Button 
              onClick={() => handleNewsOpen(true)} 
              variant="outline"
              size="icon"
              className="border-[#003c71] text-[#003c71] hover:bg-[#003c71] hover:text-white"
            >
              <Edit2 className="h-4 w-4" />
            </Button>
          </div>
          <NewsModal
            isOpen={isNewsModalOpen}
            onClose={() => {
              setIsNewsModalOpen(false);
              setIsNewsEditMode(false);
            }}
            news={isNewsEditMode ? mockNews : null}
            onSuccess={handleSuccess}
          />
        </Card>

        {/* Resource Modal */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Resource Modal</h2>
          <p className="text-gray-600 mb-4">A modal for creating/editing resources.</p>
          <div className="flex gap-2">
            <Button onClick={() => handleResourceOpen(false)} className="text-white">
              <Plus className="h-4 w-4 mr-2" />
              Create Resource
            </Button>
            <Button 
              onClick={() => handleResourceOpen(true)} 
              variant="outline"
              size="icon"
              className="border-[#003c71] text-[#003c71] hover:bg-[#003c71] hover:text-white"
            >
              <Edit2 className="h-4 w-4" />
            </Button>
          </div>
          <ResourceModal
            isOpen={isResourceModalOpen}
            onClose={() => {
              setIsResourceModalOpen(false);
              setIsResourceEditMode(false);
            }}
            resource={isResourceEditMode ? mockResource : null}
            onSuccess={handleSuccess}
          />
        </Card>

        {/* User Modal */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">User Modal</h2>
          <p className="text-gray-600 mb-4">A modal for creating/editing users.</p>
          <div className="flex gap-2">
            <Button onClick={() => handleUserOpen(false)} className="text-white">
              <Plus className="h-4 w-4 mr-2" />
              Create User
            </Button>
            <Button 
              onClick={() => handleUserOpen(true)} 
              variant="outline"
              size="icon"
              className="border-[#003c71] text-[#003c71] hover:bg-[#003c71] hover:text-white"
            >
              <Edit2 className="h-4 w-4" />
            </Button>
          </div>
          <UserModal
            isOpen={isUserModalOpen}
            onClose={() => {
              setIsUserModalOpen(false);
              setIsUserEditMode(false);
            }}
            user={isUserEditMode ? mockUser : null}
            onSuccess={handleSuccess}
          />
        </Card>
      </div>
    </div>
  )
} 