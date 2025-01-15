import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { type FirebaseNews } from "@/lib/firebase/types";
import { useAuth } from "@/hooks/useAuth";

const newsSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  date: z.string().min(1, "Date is required"),
  tags: z.string().optional(),
  imageUrl: z.string().optional(),
});

type NewsFormData = z.infer<typeof newsSchema>;

interface NewsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<FirebaseNews>) => Promise<void>;
  news: FirebaseNews | null;
}

export function NewsModal({ isOpen, onClose, onSave, news }: NewsModalProps) {
  const { user } = useAuth();
  
  const form = useForm<NewsFormData>({
    resolver: zodResolver(newsSchema),
    defaultValues: {
      title: "",
      content: "",
      date: new Date().toISOString().split('T')[0],
      tags: "",
      imageUrl: "",
    },
  });

  // Reset form when modal opens with news data or empty values
  useEffect(() => {
    if (isOpen) {
      if (news) {
        form.reset({
          title: news.title || "",
          content: news.content || "",
          date: news.date ? new Date(news.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          tags: news.tags?.join(", ") || "",
          imageUrl: news.imageUrl || "",
        });
      } else {
        form.reset({
          title: "",
          content: "",
          date: new Date().toISOString().split('T')[0],
          tags: "",
          imageUrl: "",
        });
      }
    }
  }, [isOpen, news, form]);

  const onSubmit = async (data: NewsFormData) => {
    try {
      const newsData: Partial<FirebaseNews> = {
        ...data,
        creatorName: user?.displayName || user?.email || 'Unknown user',
        tags: data.tags ? data.tags.split(",").map(tag => tag.trim()).filter(Boolean) : undefined,
      };
      await onSave(newsData);
      form.reset();
      onClose();
    } catch (error) {
      console.error("Error saving news:", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {news ? "Edit News Article" : "Create News Article"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter news title" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Enter news content"
                      className="min-h-[200px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <Input {...field} type="date" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags (comma-separated)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter tags, separated by commas" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Image URL (optional)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter image URL" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" className="bg-[#003c71] hover:bg-[#002855] text-white">
                {news ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
