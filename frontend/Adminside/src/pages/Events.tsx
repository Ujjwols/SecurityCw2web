import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
  TableHead,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import useAuth from '@/hooks/useAuth';
import api, { initializeAPI } from '@/api/api';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { FileText, Download, X, Trash2, Edit } from 'lucide-react';
import { AxiosError } from 'axios';

interface Event {
  _id: string;
  title: string;
  date?: string;
  time?: string;
  location?: string;
  description: string;
  files?: {
    url: string;
    type: string;
  }[];
}

interface ApiErrorResponse {
  message?: string;
}

const Events = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentEvent, setCurrentEvent] = useState<Event | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    time: '',
    location: '',
    description: '',
    files: [] as File[],
  });
  const { user, loading } = useAuth();
  const { toast } = useToast();

  // Get current date and time in +0545 timezone
  const getCurrentDateTime = () => {
    const now = new Date();
    const offsetMs = 5 * 60 * 60 * 1000 + 45 * 60 * 1000; // +0545
    const adjustedDate = new Date(now.getTime() + offsetMs);
    const date = adjustedDate.toISOString().split('T')[0]; // YYYY-MM-DD
    const hours = String(adjustedDate.getHours()).padStart(2, '0');
    const minutes = String(adjustedDate.getMinutes()).padStart(2, '0');
    const time = `${hours}:${minutes}`;
    return { date, time };
  };

  const { date: minDate, time: minTime } = getCurrentDateTime();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      toast({
        title: 'Unauthorized',
        description: 'Please log in to view events.',
        variant: 'destructive',
      });
      window.location.href = '/login';
      return;
    }
    if (user.role !== 'admin') {
      toast({
        title: 'Access Denied',
        description: 'Only admin users can access this page.',
        variant: 'destructive',
      });
      window.location.href = '/profile';
      return;
    }

    initializeAPI().catch((error) => {
      console.error('Failed to initialize API:', error);
      toast({
        title: 'Error',
        description: 'Failed to initialize CSRF token',
        variant: 'destructive',
      });
    });

    fetchEvents();
  }, [user, loading, toast]);

  const fetchEvents = async () => {
    try {
      const response = await api.get<{ success: boolean; data: Event[]; message: string }>(
        '/api/v1/event/get-all-event'
      );
      setEvents(response.data.data);
    } catch (error: unknown) {
      const errorMessage = error instanceof AxiosError
        ? error.response?.status === 401
          ? 'Please log in to view events.'
          : error.response?.data?.message || 'Failed to fetch events'
        : 'An unexpected error occurred';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const validateFiles = (files: File[], isUpdate: boolean = false): string | null => {
    if (!isUpdate && files.length < 1) {
      return 'At least one file is required for new events';
    }
    if (files.length > 10) {
      return 'Maximum 10 files allowed';
    }

    const fileCounts = {
      images: 0,
      videos: 0,
      documents: 0,
    };

    files.forEach((file) => {
      if (file.type.startsWith('image/')) {
        fileCounts.images++;
      } else if (file.type.startsWith('video/')) {
        fileCounts.videos++;
      } else if (
        file.type === 'application/pdf' ||
        file.type.includes('msword') ||
        file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ) {
        fileCounts.documents++;
      }
    });

    if (fileCounts.images > 5) {
      return 'Maximum 5 images allowed';
    }
    if (fileCounts.videos > 3) {
      return 'Maximum 3 videos allowed';
    }
    if (fileCounts.documents > 2) {
      return 'Maximum 2 documents allowed';
    }

    return null;
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      const updatedFiles = [
        ...formData.files,
        ...newFiles.filter((newFile) => !formData.files.some((existing) => existing.name === newFile.name)),
      ];
      setFormData({
        ...formData,
        files: updatedFiles,
      });
    }
  };

  const handleRemoveFile = (fileName: string) => {
    setFormData({
      ...formData,
      files: formData.files.filter((file) => file.name !== fileName),
    });
  };

  const handleDeleteFile = async (eventId: string, fileUrl: string) => {
    if (!window.confirm('Are you sure you want to delete this file?')) return;
    try {
      const response = await api.delete<{ success: boolean; data: Event; message: string }>(
        `/api/v1/event/delete-event-file/${eventId}/${encodeURIComponent(fileUrl)}`
      );
      setEvents(events.map((event) => (event._id === eventId ? response.data.data : event)));
      toast({
        title: 'File Deleted',
        description: response.data.message || 'File deleted successfully.',
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof AxiosError
        ? error.response?.status === 401
          ? 'Please log in as an admin to perform this action.'
          : error.response?.data?.message || 'Failed to delete file'
        : 'An unexpected error occurred';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.files.length > 0 || isEditMode) {
      const validationError = validateFiles(formData.files, isEditMode);
      if (validationError) {
        toast({
          title: 'File Validation Error',
          description: validationError,
          variant: 'destructive',
        });
        return;
      }
    }

    if (isEditMode && !formData.title && !formData.description && !formData.date && !formData.time && !formData.location && formData.files.length === 0) {
      toast({
        title: 'Update Error',
        description: 'At least one field must be provided for update.',
        variant: 'destructive',
      });
      return;
    }

    if (formData.date && formData.time) {
      const selectedDateTime = new Date(`${formData.date}T${formData.time}:00+05:45`);
      const now = new Date();
      const offsetMs = 5 * 60 * 60 * 1000 + 45 * 60 * 1000; // +0545
      const currentDateTime = new Date(now.getTime() + offsetMs);
      if (selectedDateTime < currentDateTime) {
        toast({
          title: 'Invalid Date/Time',
          description: 'Please select a date and time in the future.',
          variant: 'destructive',
        });
        return;
      }
    }

    const form = new FormData();
    form.append('title', formData.title);
    form.append('description', formData.description);
    if (formData.date) form.append('date', formData.date);
    if (formData.time) form.append('time', formData.time);
    if (formData.location) form.append('location', formData.location);
    formData.files.forEach((file) => form.append('files', file));

    try {
      await initializeAPI();
      if (isEditMode && currentEvent) {
        const response = await api.put<{ success: boolean; data: Event; message: string }>(
          `/api/v1/event/update-event/${currentEvent._id}`,
          form,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        );
        setEvents(events.map((event) => (event._id === currentEvent._id ? response.data.data : event)));
        toast({
          title: 'Event Updated',
          description: response.data.message || 'The event has been updated successfully.',
        });
      } else {
        const response = await api.post<{ success: boolean; data: Event; message: string }>(
          '/api/v1/event/create-event',
          form,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        );
        setEvents([...events, response.data.data]);
        toast({
          title: 'Event Added',
          description: response.data.message || `${formData.title} has been added to the events list.`,
        });
      }
      resetFormAndCloseModal();
    } catch (error: unknown) {
      const errorMessage = error instanceof AxiosError
        ? error.response?.status === 401
          ? 'Please log in as an admin to perform this action.'
          : error.response?.data?.message || 'Failed to save event'
        : 'An unexpected error occurred';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (event: Event) => {
    setCurrentEvent(event);
    setFormData({
      title: event.title,
      date: event.date || '',
      time: event.time || '',
      location: event.location || '',
      description: event.description,
      files: [],
    });
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;
    try {
      await initializeAPI();
      const response = await api.delete<{ success: boolean; data: object; message: string }>(
        `/api/v1/event/delete-event/${id}`
      );
      setEvents(events.filter((event) => event._id !== id));
      toast({
        title: 'Event Deleted',
        description: response.data.message || 'The event has been deleted successfully.',
        variant: 'destructive',
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof AxiosError
        ? error.response?.status === 401
          ? 'Please log in as an admin to perform this action.'
          : error.response?.data?.message || 'Failed to delete event'
        : 'An unexpected error occurred';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const resetFormAndCloseModal = () => {
    setFormData({
      title: '',
      date: '',
      time: '',
      location: '',
      description: '',
      files: [],
    });
    setCurrentEvent(null);
    setIsEditMode(false);
    setIsModalOpen(false);
  };

  const handleFileView = (file: { url: string; type: string }) => {
    window.open(file.url, '_blank');
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <img src="/image-icon.png" alt="Image" className="w-4 h-4" />;
    if (type.startsWith('video/')) return <img src="/video-icon.png" alt="Video" className="w-4 h-4" />;
    return <FileText className="w-4 h-4 text-gray-500" />;
  };

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Events</h1>
        <Button
          onClick={() => {
            setIsEditMode(false);
            setIsModalOpen(true);
          }}
          className="bg-gray-800 hover:bg-gray-700"
        >
          + Add Events
        </Button>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Files</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((event) => (
                <TableRow key={event._id}>
                  <TableCell className="font-medium">{event.title}</TableCell>
                  <TableCell>{event.date || 'N/A'}</TableCell>
                  <TableCell>{event.time || 'N/A'}</TableCell>
                  <TableCell>{event.location || 'N/A'}</TableCell>
                  <TableCell className="max-w-xs truncate">{event.description}</TableCell>
                  <TableCell>
                    {event.files && event.files.length > 0 ? (
                      event.files.map((file, index) => (
                        <div key={index} className="flex items-center space-x-2 mb-1">
                          {getFileIcon(file.type)}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleFileView(file)}
                            className="text-blue-600 hover:text-blue-800 p-0 h-auto"
                          >
                            {file.url.split('/').pop()}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleFileView(file)}
                            className="p-1 h-auto"
                          >
                            <Download className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteFile(event._id, file.url)}
                            className="p-1 h-auto"
                          >
                            <X className="w-3 h-3 text-red-500" />
                          </Button>
                        </div>
                      ))
                    ) : (
                      <span className="text-gray-400">No files</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(event)}
                      className="text-gray-600 hover:text-gray-900"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(event._id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {isEditMode ? 'Edit Event' : 'Add Events'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6 py-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <label htmlFor="title" className="text-sm font-medium">
                  Title:
                </label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="h-10"
                  required
                />
              </div>

              <div className="grid gap-2">
                <label htmlFor="date" className="text-sm font-medium">
                  Date:
                </label>
                <Input
                  id="date"
                  name="date"
                  type="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  className="h-10"
                  min={minDate}
                />
              </div>

              <div className="grid gap-2">
                <label htmlFor="time" className="text-sm font-medium">
                  Time:
                </label>
                <Input
                  id="time"
                  name="time"
                  type="time"
                  value={formData.time}
                  onChange={handleInputChange}
                  className="h-10"
                  min={formData.date === minDate ? minTime : undefined}
                />
              </div>

              <div className="grid gap-2">
                <label htmlFor="location" className="text-sm font-medium">
                  Location:
                </label>
                <Input
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="h-10"
                />
              </div>

              <div className="grid gap-2">
                <label htmlFor="description" className="text-sm font-medium">
                  Description:
                </label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="min-h-[100px]"
                  required
                />
              </div>

              <div className="grid gap-2">
                <label htmlFor="files" className="text-sm font-medium">
                  File Upload (Max 10: 5 images, 3 videos, 2 documents, optional for update):
                </label>
                <div className="flex flex-col gap-2">
                  <Input
                    id="files"
                    name="files"
                    type="file"
                    accept="image/*,video/*,.pdf,.doc,.docx"
                    multiple
                    onChange={handleFileChange}
                    className="h-auto p-2"
                  />
                  {formData.files.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.files.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded text-sm"
                        >
                          <span>{file.name}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveFile(file.name)}
                            className="p-0 h-auto"
                          >
                            <X className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  {currentEvent?.files && currentEvent.files.length > 0 && isEditMode && (
                    <span className="text-sm text-gray-500">
                      Current files: {currentEvent.files.map((file) => file.url.split('/').pop()).join(', ')}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <Button type="button" variant="outline" onClick={resetFormAndCloseModal}>
                Cancel
              </Button>
              <Button type="submit" className="bg-gray-800 hover:bg-gray-700">
                {isEditMode ? 'Update' : 'Create Event'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Events;