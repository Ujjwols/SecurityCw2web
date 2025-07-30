import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Search, Trash2, X } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import axios, { AxiosError } from 'axios';

interface GalleryImage {
  _id: string;
  url: string;
  type: string;
  publicId: string;
}

interface GalleryPost {
  _id: string;
  title: string;
  category: string;
  date: string;
  images: GalleryImage[];
  createdAt: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL;

const categories = [
  "All Photos",
  "Meetings",
  "Social Events",
  "Cultural Programs",
  "Workshops",
  "Ceremonies",
];

const Gallery = () => {
  const [posts, setPosts] = useState<GalleryPost[]>([]);
  const [filter, setFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All Photos');
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Fetch posts from backend
  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/v1/gallery/get-all-images`);
      setPosts(response.data.data);
    } catch (error) {
      handleApiError(error, "Failed to fetch posts");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApiError = (error: unknown, defaultMessage: string) => {
    const errorMessage = axios.isAxiosError(error)
      ? error.response?.data?.message || defaultMessage
      : defaultMessage;
    toast({
      title: "Error",
      description: errorMessage,
      variant: "destructive",
    });
  };

  const handleDeleteImage = async (id: string, imageId: string) => {
    if (!window.confirm('Are you sure you want to delete this image?')) return;

    try {
      setIsLoading(true);
      await axios.delete(`${API_BASE_URL}/api/v1/gallery/delete-image/${id}/${imageId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setPosts((prevPosts) =>
        prevPosts
          .map((post) =>
            post._id === id
              ? { ...post, images: post.images.filter((img) => img._id !== imageId) }
              : post
          )
          .filter((post) => post.images.length > 0)
      );
      toast({
        title: "Success",
        description: "Image deleted successfully",
      });
    } catch (error) {
      handleApiError(error, "Failed to delete image");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePost = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this entire post?')) return;

    try {
      setIsLoading(true);
      await axios.delete(`${API_BASE_URL}/api/v1/gallery/delete-post/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setPosts((prevPosts) => prevPosts.filter((post) => post._id !== id));
      toast({
        title: "Success",
        description: "Post deleted successfully",
      });
    } catch (error) {
      handleApiError(error, "Failed to delete post");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadImages = async (e: React.FormEvent, files: File[], title: string, category: string, date: string) => {
    e.preventDefault();

    if (!files || files.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please select at least one image",
        variant: "destructive",
      });
      return;
    }

    if (files.length > 10) {
      toast({
        title: "Validation Error",
        description: "You can upload a maximum of 10 images at a time",
        variant: "destructive",
      });
      return;
    }

    if (!title) {
      toast({
        title: "Validation Error",
        description: "Please provide a title for the post",
        variant: "destructive",
      });
      return;
    }

    if (!category) {
      toast({
        title: "Validation Error",
        description: "Please select a category for the post",
        variant: "destructive",
      });
      return;
    }

    if (!date) {
      toast({
        title: "Validation Error",
        description: "Please select a date for the post",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      const formData = new FormData();
      files.forEach((file) => formData.append('images', file));
      formData.append('title', title);
      formData.append('category', category);
      formData.append('date', date);

      const response = await axios.post(`${API_BASE_URL}/api/v1/gallery/upload-images`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      setPosts([response.data.data, ...posts]);
      toast({
        title: "Success",
        description: `Successfully uploaded post with ${response.data.data.images.length} image(s)`,
      });
    } catch (error) {
      handleApiError(error, "Failed to upload images");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredPosts = posts.filter((post) => {
    const matchesTitle = filter ? post.title.toLowerCase().includes(filter.toLowerCase()) : true;
    const matchesCategory = categoryFilter === 'All Photos' || !categoryFilter ? true : post.category === categoryFilter;
    return matchesTitle && matchesCategory;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-800">Gallery</h1>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Upload Form */}
          <Card className="p-6 lg:w-1/3 space-y-4">
            <h2 className="text-xl font-semibold">Upload New Post</h2>
            <UploadForm onSubmit={handleUploadImages} isLoading={isLoading} />
          </Card>

          {/* Gallery Section */}
          <div className="lg:w-2/3 space-y-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center gap-4">
                <h2 className="text-xl font-semibold">Gallery Posts</h2>
                <div className="flex gap-2">
                  <Input
                    type="search"
                    placeholder="Filter posts by title..."
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="max-w-xs"
                  />
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {isLoading && !posts.length ? (
                <div className="text-center py-12">Loading posts...</div>
              ) : filteredPosts.length === 0 ? (
                <div className="text-center py-12 border rounded-md bg-gray-50">
                  <p>No posts found</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {filteredPosts.map((post) => (
                    <Card key={post._id} className="p-4 relative">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-semibold text-lg">{post.title}</h3>
                          <p className="text-sm text-gray-500">
                            Category: {post.category}
                          </p>
                          <p className="text-sm text-gray-500">
                            Date: {new Date(post.date).toLocaleDateString()}
                          </p>
                          <p className="text-sm text-gray-500">
                            Uploaded: {new Date(post.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeletePost(post._id)}
                          className="p-2"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="ml-2">Delete Post</span>
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {post.images.map((image) => (
                          <div key={image._id} className="relative group">
                            <img
                              src={image.url}
                              alt={post.title}
                              className="w-full h-48 object-cover rounded-md"
                            />
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDeleteImage(post._id, image._id)}
                                className="p-2"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

// Separate upload form component
const UploadForm = ({
  onSubmit,
  isLoading,
}: {
  onSubmit: (e: React.FormEvent, files: File[], title: string, category: string, date: string) => void;
  isLoading: boolean;
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('All Photos');
  const [date, setDate] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      const totalFiles = files.length + newFiles.length;

      if (totalFiles > 10) {
        toast({
          title: "Validation Error",
          description: `You can select a maximum of 10 images. Currently selected: ${files.length}`,
          variant: "destructive",
        });
        return;
      }

      setFiles((prevFiles) => [...prevFiles, ...newFiles]);
      const newUrls = newFiles.map((file) => URL.createObjectURL(file));
      setPreviewUrls((prevUrls) => [...prevUrls, ...newUrls]);
    }
  };

  const handleRemoveFile = (index: number) => {
    URL.revokeObjectURL(previewUrls[index]);
    setFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
    setPreviewUrls((prevUrls) => prevUrls.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length > 0) {
      onSubmit(e, files, title, category, date);
      setTitle('');
      setCategory('All Photos');
      setDate('');
      setFiles([]);
      setPreviewUrls((prevUrls) => {
        prevUrls.forEach((url) => URL.revokeObjectURL(url));
        return [];
      });
      const fileInput = document.getElementById('imageFiles') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    }
  };

  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="postTitle">Post Title</Label>
        <Input
          id="postTitle"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter title for post"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Category</Label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger id="category">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="date">Date</Label>
        <Input
          id="date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="imageFiles">Image Files (Max 10, {files.length} selected)</Label>
        <Input
          id="imageFiles"
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          className="cursor-pointer"
        />
      </div>

      <div className="mt-4">
        <p className="text-sm text-gray-500 mb-2">Previews ({previewUrls.length}):</p>
        <div className="grid grid-cols-2 gap-2">
          {previewUrls.map((url, index) => (
            <div key={index} className="relative">
              <img
                src={url}
                alt={`Preview ${index + 1}`}
                className="w-full h-24 object-cover rounded-md"
              />
              <Button
                variant="destructive"
                size="sm"
                className="absolute top-1 right-1 p-1"
                onClick={() => handleRemoveFile(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={isLoading || files.length === 0}>
        {isLoading ? 'Uploading...' : `Upload Post with ${files.length} Image${files.length > 1 ? 's' : ''}`}
      </Button>
    </form>
  );
};

export default Gallery;