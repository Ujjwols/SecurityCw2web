import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar, Mail, Settings, User, Loader2, Camera } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import useAuth from '@/hooks/useAuth';
import api, { initializeAPI } from '@/api/api';
import { AxiosError } from 'axios';

interface User {
  _id: string;
  username: string;
  email: string;
  role: 'admin' | 'user';
  profilePic: string;
  createdAt: string;
  updatedAt: string;
}

const Profile = () => {
  const { user: currentUser, loading: authLoading, logout } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    username: '',
    email: '',
  });

  // File state
  const [profilePic, setProfilePic] = useState<File | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!currentUser) {
      toast({
        title: 'Unauthorized',
        description: 'Please log in to view your profile.',
        variant: 'destructive',
      });
      window.location.href = '/login';
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

    fetchUserProfile();
  }, [currentUser, authLoading, toast]);

  const fetchUserProfile = async () => {
    if (!currentUser?._id) return;

    try {
      setLoading(true);
      const response = await api.get<{ success: boolean; data: User; message: string }>(
        `/user/get-user/${currentUser._id}`
      );
      if (response.data.success) {
        setUser(response.data.data);
        setFormData({
          username: response.data.data.username,
          email: response.data.data.email,
        });
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof AxiosError
        ? error.response?.data?.message || 'Failed to fetch profile'
        : 'An unexpected error occurred';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { files } = e.target;
    if (files && files[0]) {
      setProfilePic(files[0]);
    }
  };

  const handleEditProfile = () => {
    setIsEditModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    try {
      setIsEditing(true);
      const formDataToSend = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value) {
          formDataToSend.append(key, value);
        }
      });
      if (profilePic) {
        formDataToSend.append("profilePic", profilePic);
      }

      const response = await api.patch<{ success: boolean; data: User; message: string }>(
        `/user/update-user/${user._id}`,
        formDataToSend,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (response.data.success) {
        setUser(response.data.data);
        setFormData({
          username: response.data.data.username,
          email: response.data.data.email,
        });
        toast({
          title: 'Success',
          description: 'Profile updated successfully',
        });
        setIsEditModalOpen(false);
        setProfilePic(null);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof AxiosError
        ? error.response?.data?.message || 'Failed to update profile'
        : 'An unexpected error occurred';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsEditing(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Profile Not Found</h1>
          <p className="text-muted-foreground mb-6">Unable to load your profile information.</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <Card className="mb-8">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex flex-col items-center md:items-start">
                <div className="relative">
                  <Avatar className="w-32 h-32 mb-4">
                    <AvatarImage src={user.profilePic} alt={user.username} />
                    <AvatarFallback className="text-2xl">
                      {user.username.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute bottom-4 right-4">
                    <Camera className="w-6 h-6 text-gray-600" />
                  </div>
                </div>
                <Button variant="outline" className="w-full md:w-auto" onClick={handleEditProfile}>
                  <Settings className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
                <Button variant="destructive" className="w-full md:w-auto mt-2" onClick={logout}>
                  Logout
                </Button>
              </div>
              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-4">
                  <div>
                    <h1 className="text-3xl font-bold text-foreground mb-2">{user.username}</h1>
                    <p className="text-muted-foreground mb-4">EventHub {user.role}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Mail className="w-4 h-4" />
                    <span>{user.email}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    <span>Last updated {new Date(user.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-1">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Profile Information
            </TabsTrigger>
          </TabsList>
          <TabsContent value="profile" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-2">Personal Information</h3>
                    <div className="space-y-2">
                      <div>
                        <span className="text-sm text-muted-foreground">Username:</span>
                        <p className="font-medium">{user.username}</p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Email:</span>
                        <p className="font-medium">{user.email}</p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Account Information</h3>
                    <div className="space-y-2">
                      <div>
                        <span className="text-sm text-muted-foreground">Member Since:</span>
                        <p className="font-medium">{new Date(user.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Last Updated:</span>
                        <p className="font-medium">{new Date(user.updatedAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Profile Dialog */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Edit Profile</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="username" className="text-sm font-medium">
                  Username
                </Label>
                <Input
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="profilePic" className="text-sm font-medium">
                  Profile Picture
                </Label>
                <Input
                  id="profilePic"
                  name="profilePic"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                />
                {user.profilePic && (
                  <a
                    href={user.profilePic}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 text-sm"
                  >
                    View Current Profile Picture
                  </a>
                )}
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setProfilePic(null);
                }}
                disabled={isEditing}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isEditing}>
                {isEditing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Profile'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Profile;