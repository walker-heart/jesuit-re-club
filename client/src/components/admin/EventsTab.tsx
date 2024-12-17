'use client'

import { useState, useEffect } from 'react'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { EventModal } from '@/components/admin/EventModal'
import { fetchEvents, type FirebaseEvent } from '@/lib/firebase/events'
import { useToast } from '@/hooks/use-toast'
import { auth } from '@/lib/firebase/firebase-config'

export function EventsTab() {
  const [searchTerm, setSearchTerm] = useState('')
  const [events, setEvents] = useState<FirebaseEvent[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    loadEvents()
  }, [])

  const loadEvents = async () => {
    try {
      setIsLoading(true)
      const fetchedEvents = await fetchEvents()
      setEvents(fetchedEvents)
    } catch (error: any) {
      console.error('Error loading events:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to load events",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const filteredEvents = events.filter(event => {
    const searchLower = searchTerm.toLowerCase();
    return event.title.toLowerCase().includes(searchLower) || 
           event.speaker.toLowerCase().includes(searchLower) ||
           event.location.toLowerCase().includes(searchLower);
  });

  const handleEventCreated = (newEvent: FirebaseEvent) => {
    loadEvents(); // Reload all events to ensure we have the latest data
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Input
          type="text"
          placeholder="Search events..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Button onClick={() => setIsModalOpen(true)}>Create Event</Button>
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Date & Time</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Speaker</TableHead>
              <TableHead>Created By</TableHead>
              <TableHead>Created At</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <div className="flex items-center justify-center text-sm text-muted-foreground">
                    Loading events...
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredEvents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <div className="flex flex-col items-center justify-center text-sm text-muted-foreground">
                    <p>No events found</p>
                    {searchTerm && <p className="mt-1">Try adjusting your search</p>}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredEvents.map((event) => (
                <TableRow key={event.id}>
                  <TableCell className="font-medium">{event.title}</TableCell>
                  <TableCell>{`${event.date} at ${event.time}`}</TableCell>
                  <TableCell>{event.location}</TableCell>
                  <TableCell>{event.speaker}</TableCell>
                  <TableCell>{event.userCreated}</TableCell>
                  <TableCell>{event.createdAt}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <EventModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onEventCreated={handleEventCreated}
      />
    </div>
  );
}
