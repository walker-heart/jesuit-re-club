import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, BookOpen, Newspaper } from 'lucide-react'
import { EditModal } from './EditModal'

type EventItem = {
  id: number;
  title: string;
  date: string;
  time: string;
  location: string;
  speaker: string;
  speakerDescription: string;
  agenda: string;
}

type ResourceItem = {
  id: number;
  title: string;
  description: string;
}

type NewsItem = {
  id: number;
  title: string;
  date: string;
  author: string;
}

// Mock data for posts
const mockPosts = {
  events: [
    { id: 1, title: "Guest Speaker: John Doe", date: "2023-05-15", time: "16:00", location: "Jesuit Dallas Auditorium", speaker: "John Doe", speakerDescription: "Expert in commercial real estate", agenda: "1. Introduction\n2. Main presentation\n3. Q&A session" },
    { id: 2, title: "Real Estate Market Analysis Workshop", date: "2023-06-01", time: "15:30", location: "Room 201", speaker: "Jane Smith", speakerDescription: "Market analyst with 15 years of experience", agenda: "1. Market trends\n2. Analysis techniques\n3. Practical exercises" },
    { id: 3, title: "Property Valuation Seminar", date: "2023-06-15", time: "14:00", location: "Conference Room A", speaker: "Mike Johnson", speakerDescription: "Certified property appraiser", agenda: "1. Valuation methods\n2. Case studies\n3. Group discussion" },
  ],
  resources: [
    { id: 1, title: "Introduction to Real Estate", description: "A comprehensive guide to understanding the basics of real estate." },
    { id: 2, title: "Real Estate Market Analysis", description: "Learn how to analyze real estate markets and identify trends." },
    { id: 3, title: "Real Estate Investment Strategies", description: "Explore various strategies for investing in real estate." },
  ],
  news: [
    { id: 1, title: "Club Wins National Competition", date: "2023-04-30", author: "Sarah Thompson" },
    { id: 2, title: "New Partnership with Local Real Estate Firm", date: "2023-03-15", author: "David Wilson" },
    { id: 3, title: "Upcoming Workshop: Real Estate Finance Fundamentals", date: "2023-02-28", author: "Emily Brown" },
  ],
}

export function PostsTab() {
  const [editingItem, setEditingItem] = useState<EventItem | ResourceItem | NewsItem | null>(null);
  const [editingType, setEditingType] = useState<'event' | 'resource' | 'news' | null>(null);
  const [posts, setPosts] = useState(mockPosts);

  const handleEdit = (item: EventItem | ResourceItem | NewsItem, type: 'event' | 'resource' | 'news') => {
    setEditingItem(item);
    setEditingType(type);
  };

  const handleSave = (updatedItem: EventItem | ResourceItem | NewsItem) => {
    if (editingType) {
      setPosts(prevPosts => {
        const key = `${editingType}s` as keyof typeof prevPosts;
        return {
          ...prevPosts,
          [key]: prevPosts[key].map((item: any) => 
            item.id === updatedItem.id ? updatedItem : item
          )
        };
      });
    }
    setEditingItem(null);
    setEditingType(null);
  };

  const handleDelete = (id: number, type: 'event' | 'resource' | 'news') => {
    setPosts(prevPosts => {
      const key = `${type}s` as keyof typeof prevPosts;
      return {
        ...prevPosts,
        [key]: prevPosts[key].filter((item: any) => item.id !== id)
      };
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="mr-2" />
            Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {posts.events.map((event) => (
              <Card key={event.id} className="p-4 relative">
                <h3 className="text-lg font-semibold text-[#003c71] mb-2">{event.title}</h3>
                <p className="text-sm text-gray-600 mb-1">{event.date} | {event.time}</p>
                <p className="text-sm text-gray-600 mb-2">{event.location}</p>
                <p className="text-sm text-gray-600 mb-2">Speaker: {event.speaker}</p>
                <div className="absolute bottom-4 right-4 space-x-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(event, 'event')}>Edit</Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(event.id, 'event')}>Delete</Button>
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center">
            <BookOpen className="mr-2" />
            Resources
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {posts.resources.map((resource) => (
              <Card key={resource.id} className="p-4 relative">
                <h3 className="text-lg font-semibold text-[#003c71] mb-2">{resource.title}</h3>
                <p className="text-sm text-gray-600 mb-4">{resource.description}</p>
                <div className="absolute bottom-4 right-4 space-x-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(resource, 'resource')}>Edit</Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(resource.id, 'resource')}>Delete</Button>
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Newspaper className="mr-2" />
            News
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {posts.news.map((newsItem) => (
              <Card key={newsItem.id} className="p-4 relative">
                <h3 className="text-lg font-semibold text-[#003c71] mb-2">{newsItem.title}</h3>
                <p className="text-sm text-gray-500 mb-2">{newsItem.date}</p>
                <p className="text-sm text-gray-600 mb-4">By {newsItem.author}</p>
                <div className="absolute bottom-4 right-4 space-x-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(newsItem, 'news')}>Edit</Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(newsItem.id, 'news')}>Delete</Button>
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <EditModal
        isOpen={!!editingItem}
        onClose={() => {
          setEditingItem(null);
          setEditingType(null);
        }}
        onSave={handleSave}
        item={editingItem}
        type={editingType || 'event'}
      />
    </div>
  )
}
