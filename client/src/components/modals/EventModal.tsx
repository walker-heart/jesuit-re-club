import { useState, useEffect } from "react"
import { FormModal } from "./FormModal"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useEvents } from "@/hooks/use-events"
import { auth } from "@/lib/firebase/firebase-config"
import type { FirebaseEvent } from "@/lib/firebase/types"

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  event?: FirebaseEvent | null;
  isSubmitting?: boolean;
}

interface EventFormData {
  title: string;
  date: string;
  time: string;
  location: string;
  speaker: string;
  speakerDescription: string;
  agenda: string;
  url: string;
  userId: string;
}

export function EventModal({ isOpen, onClose, onSuccess, event, isSubmitting }: EventModalProps) {
  const { createEvent, updateEvent } = useEvents();
  const [formData, setFormData] = useState<EventFormData>({
    title: "",
    date: "",
    time: "",
    location: "",
    speaker: "",
    speakerDescription: "",
    agenda: "",
    url: "",
    userId: auth.currentUser?.uid || ""
  });

  // Reset form when modal is opened/closed
  useEffect(() => {
    if (isOpen) {
      if (event) {
        // Editing existing event
        setFormData({
          title: event.title || "",
          date: event.date || "",
          time: event.time || "",
          location: event.location || "",
          speaker: event.speaker || "",
          speakerDescription: event.speakerDescription || "",
          agenda: event.agenda || "",
          url: event.url || "",
          userId: event.userId || auth.currentUser?.uid || ""
        });
      } else {
        // Creating new event
        setFormData({
          title: "",
          date: "",
          time: "",
          location: "",
          speaker: "",
          speakerDescription: "",
          agenda: "",
          url: "",
          userId: auth.currentUser?.uid || ""
        });
      }
    }
  }, [event, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    const requiredFields: Array<keyof EventFormData> = ['title', 'date', 'time', 'location', 'speaker', 'speakerDescription', 'agenda', 'userId'];
    const missingFields = requiredFields.filter(field => !formData[field]);
    
    if (missingFields.length > 0) {
      return;
    }

    try {
      if (event?.id) {
        await updateEvent(event.id, formData);
      } else {
        await createEvent(formData);
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving event:', error);
    }
  };

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title={event ? "Edit Event" : "Create Event"}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
    >
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="h-8"
            />
          </div>
          <div>
            <Label htmlFor="date">Date *</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="h-8"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="time">Time *</Label>
            <Input
              id="time"
              type="time"
              value={formData.time}
              onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              className="h-8"
            />
          </div>
          <div>
            <Label htmlFor="location">Location *</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="h-8"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="speaker">Speaker *</Label>
          <Input
            id="speaker"
            value={formData.speaker}
            onChange={(e) => setFormData({ ...formData, speaker: e.target.value })}
            className="h-8"
          />
        </div>

        <div>
          <Label htmlFor="speakerDescription">Speaker Description *</Label>
          <Textarea
            id="speakerDescription"
            value={formData.speakerDescription}
            onChange={(e) => setFormData({ ...formData, speakerDescription: e.target.value })}
            className="min-h-[60px] max-h-[100px]"
          />
        </div>

        <div>
          <Label htmlFor="agenda">Agenda *</Label>
          <Textarea
            id="agenda"
            value={formData.agenda}
            onChange={(e) => setFormData({ ...formData, agenda: e.target.value })}
            className="min-h-[60px] max-h-[100px]"
          />
        </div>

        <div>
          <Label htmlFor="url">URL</Label>
          <Input
            id="url"
            type="url"
            value={formData.url}
            onChange={(e) => setFormData({ ...formData, url: e.target.value })}
            className="h-8"
          />
        </div>
      </div>
    </FormModal>
  );
} 