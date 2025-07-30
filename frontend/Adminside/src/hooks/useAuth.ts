import { useState, useEffect } from 'react';
import api, { initializeAPI } from '../api/api';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { AxiosError } from 'axios';

interface User {
  _id: string;
  username: string;
  email: string;
  role: 'admin' | 'user';
  profilePic: string;
  createdAt: string;
}

const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [otpToken, setOtpToken] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        await initializeAPI();
        const { data } = await api.get('/user/users/get-current-user');
        if (data.success) {
          // Only allow admin users to access admin interface
          if (data.data.role === 'admin') {
            setUser(data.data);
            navigate('/events');
          } else {
            toast({
              title: 'Access Denied',
              description: 'You do not have admin privileges.',
              variant: 'destructive',
            });
            navigate('/login');
          }
        }
      } catch (error) {
        console.error('Failed to fetch user:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [navigate, toast]);

  const login = async (email: string, password: string) => {
    try {
      await initializeAPI();
      const { data } = await api.post(
        '/user/send-otp', 
        { 
          email, 
          password,
          deliveryMethod: 'email'
        },
        {
          headers: {
            'x-admin-frontend': 'true' // Explicitly identify as admin request
          }
        }
      );

      if (data.success) {
        setOtpToken(data.data.token);
        toast({
          title: 'OTP Sent',
          description: 'OTP has been sent to your email.',
        });
        return true;
      }
      return false;
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        toast({
          title: 'Login Failed',
          description: error.response?.data?.message || 'Please check your credentials and try again.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Login Failed',
          description: error instanceof Error ? error.message : 'An unexpected error occurred.',
          variant: 'destructive',
        });
      }
      console.error('Login error:', error);
      return false;
    }
  };

  const verifyOtp = async (otp: string, token: string) => {
    try {
      await initializeAPI();
      const { data } = await api.post('/user/verify-otp', { 
        otp, 
        token 
      }, {
        headers: {
          'x-admin-frontend': 'true' // Consistent with login
        }
      });

      if (data.success) {
        // Check if user needs password update
        if (data.data.needsPasswordUpdate) {
          toast({
            title: 'Password Update Required',
            description: 'Your password is older than 90 days. Please update it.',
            variant: 'destructive',
          });
          navigate(`/update-password/${data.data.userId}`);
          return true;
        }

        // Verify the user is an admin
        if (data.data.loggedInUser && data.data.loggedInUser.role !== 'admin') {
          toast({
            title: 'Access Denied',
            description: 'Only admin users can access this interface.',
            variant: 'destructive',
          });
          navigate('/login');
          return false;
        }

        setUser(data.data.loggedInUser);
        setOtpToken(null);
        toast({
          title: 'Login Successful',
          description: 'Welcome to the admin dashboard.',
        });
        navigate('/events');
        return true;
      }
      return false;
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        toast({
          title: 'OTP Verification Failed',
          description: error.response?.data?.message || 'Please check your OTP and try again.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'OTP Verification Failed',
          description: error instanceof Error ? error.message : 'An unexpected error occurred.',
          variant: 'destructive',
        });
      }
      console.error('OTP verification error:', error);
      return false;
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      await initializeAPI();
      const { data } = await api.post('/user/forgot-password', { 
        email,
        deliveryMethod: 'email'
      }, {
        headers: {
          'x-admin-frontend': 'true'
        }
      });
      if (data.success) {
        setOtpToken(data.data.token);
        toast({
          title: 'OTP Sent',
          description: 'Password reset OTP has been sent to your email.',
        });
        return true;
      }
      return false;
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        toast({
          title: 'Forgot Password Failed',
          description: error.response?.data?.message || 'Failed to send OTP.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Forgot Password Failed',
          description: 'An unexpected error occurred.',
          variant: 'destructive',
        });
      }
      console.error('Forgot password error:', error);
      return false;
    }
  };

  const resetPassword = async (otp: string, token: string, newPassword: string) => {
    try {
      await initializeAPI();
      const { data } = await api.post('/user/reset-password', { 
        otp, 
        token, 
        newPassword 
      }, {
        headers: {
          'x-admin-frontend': 'true'
        }
      });
      if (data.success) {
        setOtpToken(null);
        toast({
          title: 'Password Reset Successful',
          description: 'Your password has been reset successfully.',
        });
        return true;
      }
      return false;
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        toast({
          title: 'Password Reset Failed',
          description: error.response?.data?.message || 'Failed to reset password.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Password Reset Failed',
          description: 'An unexpected error occurred.',
          variant: 'destructive',
        });
      }
      console.error('Reset password error:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await initializeAPI();
      const { data } = await api.post('/user/logout');
      if (data.success) {
        setUser(null);
        setOtpToken(null);
        toast({
          title: 'Logged Out',
          description: 'You have been logged out successfully.',
        });
        navigate('/login');
      }
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        toast({
          title: 'Logout Failed',
          description: error.response?.data?.message || 'Failed to log out.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Logout Failed',
          description: 'An unexpected error occurred.',
          variant: 'destructive',
        });
      }
      console.error('Logout error:', error);
    }
  };

  return { user, loading, login, verifyOtp, forgotPassword, resetPassword, logout, otpToken };
};

export default useAuth;