import React, { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
  TableHead,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/context/AuthContext';
import api from "@/api/api";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { FileText, Download, X, Trash2, Edit, UserPlus, Loader2 } from 'lucide-react';
import { AxiosError } from "axios";

interface User {
  _id: string;
  username: string;
  email: string;
  role: 'admin' | 'user';
  profilePic: string;
  createdAt: string;
  updatedAt: string;
}

const Members: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { user: adminUser, loading: authLoading } = useAuth();
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    role: "user" as 'admin' | 'user',
  });

  // File state
  const [profilePic, setProfilePic] = useState<File | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!adminUser) {
      toast({
        title: 'Unauthorized',
        description: 'Please log in to view members.',
        variant: 'destructive',
      });
      window.location.href = '/login';
      return;
    }
    if (adminUser.role !== 'admin') {
      toast({
        title: 'Access Denied',
        description: 'Only admin users can access this page.',
        variant: 'destructive',
      });
      window.location.href = '/profile';
      return;
    }

    // API is already initialized in App.tsx, no need to initialize again here

    fetchUsers();
  }, [adminUser, authLoading, toast]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await api.get<{ success: boolean; data: User[]; message: string }>(
        '/user/get-all-users'
      );
      if (response.data.success) {
        setUsers(response.data.data);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof AxiosError
        ? error.response?.status === 401
          ? 'Please log in to view users.'
          : error.response?.data?.message || 'Failed to fetch users'
        : 'An unexpected error occurred';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    if (!formData.username.trim()) {
      return "Username is required";
    }
    if (!formData.email.trim()) {
      return "Email is required";
    }
    if (!isEditMode && !formData.password.trim()) {
      return "Password is required for new users";
    }
    if (formData.password && formData.password.length < 6) {
      return "Password must be at least 6 characters";
    }
    if (!["admin", "user"].includes(formData.role)) {
      return "Invalid role selected";
    }
    return "";
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
    const { files } = e.target;
    if (files && files[0]) {
      setProfilePic(files[0]);
    }
  };

  const handleEdit = async (user: User) => {
    try {
      setError("");
      const response = await api.get<{ success: boolean; data: User; message: string }>(
        `/user/get-user/${user._id}`
      );
      
      if (response.data.success) {
        const userData = response.data.data;
        setCurrentUser(userData);
        setFormData({
          username: userData.username,
          email: userData.email,
          role: userData.role,
          password: "",
        });
        setProfilePic(null);
        setIsEditMode(true);
        setIsModalOpen(true);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof AxiosError
        ? error.response?.data?.message || 'Failed to fetch user details'
        : 'An unexpected error occurred';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      toast({
        title: 'Validation Error',
        description: validationError,
        variant: 'destructive',
      });
      return;
    }

    try {
      setError("");
      const formDataToSend = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value) {
          formDataToSend.append(key, value);
        }
      });
      if (profilePic) {
        formDataToSend.append("profilePic", profilePic);
      }

      if (isEditMode && currentUser) {
        const response = await api.patch<{ success: boolean; data: User; message: string }>(
          `/user/update-user/${currentUser._id}`,
          formDataToSend,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        );
        if (response.data.success) {
          setUsers(users.map((user) => (user._id === currentUser._id ? response.data.data : user)));
          toast({
            title: 'Success',
            description: 'User updated successfully',
          });
        }
      } else {
        const response = await api.post<{ success: boolean; data: User; message: string }>(
          '/user/register',
          formDataToSend,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        );
        if (response.data.success) {
          setUsers([...users, response.data.data]);
          toast({
            title: 'Success',
            description: 'User created successfully',
          });
        }
      }
      resetFormAndCloseModal();
    } catch (error: unknown) {
      const errorMessage = error instanceof AxiosError
        ? error.response?.data?.message || 'Failed to save user'
        : 'An unexpected error occurred';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this user?")) {
      return;
    }

    try {
      setError("");
      const response = await api.delete<{ success: boolean; data: object; message: string }>(
        `/user/delete-user/${id}`
      );
      if (response.data.success) {
        setUsers(users.filter((user) => user._id !== id));
        toast({
          title: 'Success',
          description: 'User deleted successfully',
        });
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof AxiosError
        ? error.response?.data?.message || 'Failed to delete user'
        : 'An unexpected error occurred';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const resetFormAndCloseModal = () => {
    setFormData({
      username: "",
      email: "",
      password: "",
      role: "user",
    });
    setProfilePic(null);
    setCurrentUser(null);
    setIsEditMode(false);
    setIsModalOpen(false);
    setError("");
  };

  if (authLoading || loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (!adminUser || adminUser.role !== 'admin') {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Members</h1>
        <Button
          onClick={() => {
            setIsEditMode(false);
            setIsModalOpen(true);
          }}
          className="bg-gray-800 hover:bg-gray-700"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          + Add Member
        </Button>
      </div>

      {error && <div className="text-red-500 mb-4">{error}</div>}

      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Profile</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-500">
                    No users found.
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user._id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                          {user.profilePic ? (
                            <img 
                              src={user.profilePic} 
                              alt={user.username}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-gray-600 font-medium">
                              {user.username.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{user.username}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell className="capitalize">{user.role}</TableCell>
                    <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(user)}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(user._id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Add/Edit User Dialog */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {isEditMode ? "Edit Member" : "Add Member"}
            </DialogTitle>
            <DialogDescription>
              {isEditMode ? "Update member details" : "Fill in the member details"}
            </DialogDescription>
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
                <Label htmlFor="role" className="text-sm font-medium">
                  Role
                </Label>
                <Select
                  value={formData.role}
                  onValueChange={(value: 'admin' | 'user') =>
                    setFormData({ ...formData, role: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {!isEditMode && (
                <div className="grid gap-2">
                  <Label htmlFor="password" className="text-sm font-medium">
                    Password
                  </Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required={!isEditMode}
                  />
                </div>
              )}

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
                {isEditMode && currentUser?.profilePic && (
                  <a
                    href={currentUser.profilePic}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 text-sm"
                  >
                    View Current Profile Picture
                  </a>
                )}
              </div>
            </div>

            {error && <div className="text-red-500 text-sm">{error}</div>}

            <div className="flex justify-between pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={resetFormAndCloseModal}
              >
                Cancel
              </Button>

              <div className="flex gap-2">
                {isEditMode && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => {
                      if (currentUser) {
                        handleDelete(currentUser._id);
                        resetFormAndCloseModal();
                      }
                    }}
                  >
                    Delete
                  </Button>
                )}

                <Button type="submit" className="bg-gray-700 text-white px-6">
                  {isEditMode ? "Update" : "Create"}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Members;
