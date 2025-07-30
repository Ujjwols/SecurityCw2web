import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from "@/hooks/use-toast";
import axios, { AxiosError } from 'axios';

// Type definitions at the top
interface Notification {
  id: number;
  title: string;
  message: string;
  read: boolean;
  timestamp: Date;
}

interface AuthContextType {
  isAuthenticated: boolean;
  login: (email: string, password: string, deliveryMethod: 'sms' | 'email') => Promise<boolean>;
  verifyOtp: (otp: string, token: string, deliveryMethod: 'sms' | 'email') => Promise<boolean>;
  logout: () => Promise<void>;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  notifications: Notification[];
  dismissNotification: (id: number) => void;
  addNotification: (notification: Omit<Notification, 'id' | 'read' | 'timestamp'>) => void;
  otpToken: string | null; // Added to interface
  deliveryMethod: 'sms' | 'email' | null; // Added to interface
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);


const API_BASE_URL = import.meta.env.VITE_API_URL;



// Define hook first for Fast Refresh compatibility
function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [otpToken, setOtpToken] = useState<string | null>(null);
  const [deliveryMethod, setDeliveryMethod] = useState<'sms' | 'email' | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Load theme and check auth status on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || savedTheme === 'light') {
      setTheme(savedTheme);
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    }
  }, []);

  const checkAuthStatus = useCallback(async () => {
    try {
      console.log('Sending check-auth request to:', `${API_BASE_URL}/api/v1/user/check-auth`);
      const response = await axios.get(`${API_BASE_URL}/api/v1/user/check-auth`, {
        withCredentials: true,
        headers: { 'x-admin-frontend': 'true' },
      });
      console.log('Check-auth response:', response.data);
      if (response.status === 200 && response.data.data) {
        setIsAuthenticated(true);
      }
    } catch (error) {
      setIsAuthenticated(false);
      if (error instanceof AxiosError) {
        console.error('Check-auth error:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message,
        });
      } else {
        console.error('Check-auth error:', error);
      }
    }
  }, []);

  const login = useCallback(async (email: string, password: string, deliveryMethod: 'sms' | 'email') => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/v1/user/send-otp`,
        { email, password, deliveryMethod },
        { withCredentials: true, headers: { 'x-admin-frontend': 'true' } }
      );

      if (response.data.success) {
        setOtpToken(response.data.data.token);
        setDeliveryMethod(deliveryMethod);
        toast({
          title: 'OTP Sent',
          description: `An OTP has been sent to your ${deliveryMethod === 'sms' ? 'mobile number' : 'email'} for verification.`,
        });
        navigate('/verify-otp');
        return true;
      }
      
      toast({
        title: 'Login Failed',
        description: response.data.message || 'Invalid email or password',
        variant: 'destructive',
      });
      return false;
    } catch (error) {
      const message = error instanceof AxiosError 
        ? error.response?.data?.message || 'An error occurred during login'
        : 'An unexpected error occurred during login';
      
      toast({
        title: 'Login Failed',
        description: message,
        variant: 'destructive',
      });
      return false;
    }
  }, [navigate, toast]);

  const verifyOtp = useCallback(async (otp: string, token: string, deliveryMethod: 'sms' | 'email') => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/v1/user/verify-otp`,
        { otp, token, deliveryMethod },
        { withCredentials: true, headers: { 'x-admin-frontend': 'true' } }
      );

      if (response.data.success) {
        setIsAuthenticated(true);
        setOtpToken(null);
        setDeliveryMethod(null);
        toast({
          title: 'Login Successful',
          description: 'Welcome back to REST admin panel',
        });
        navigate('/dashboard');
        return true;
      }
      
      toast({
        title: 'OTP Verification Failed',
        description: response.data.message || 'Invalid OTP',
        variant: 'destructive',
      });
      return false;
    } catch (error) {
      const message = error instanceof AxiosError
        ? error.response?.data?.message || 'An error occurred during OTP verification'
        : 'An unexpected error occurred during OTP verification';
      
      toast({
        title: 'OTP Verification Failed',
        description: message,
        variant: 'destructive',
      });
      return false;
    }
  }, [navigate, toast]);

  const logout = useCallback(async () => {
    try {
      await axios.post(
        `${API_BASE_URL}/api/v1/user/logout`,
        {},
        { withCredentials: true, headers: { 'x-admin-frontend': 'true' } }
      );
      setIsAuthenticated(false);
      navigate('/login');
      toast({
        title: 'Logged Out Successfully',
        description: 'You have been logged out of your account.',
      });
    } catch (error) {
      const message = error instanceof AxiosError
        ? error.response?.data?.message || 'An error occurred during logout'
        : 'An unexpected error occurred during logout';
      
      toast({
        title: 'Logout Failed',
        description: message,
        variant: 'destructive',
      });
    }
  }, [navigate, toast]);

  const toggleTheme = useCallback(() => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
    toast({
      title: `${newTheme.charAt(0).toUpperCase()}${newTheme.slice(1)} Theme Activated`,
      description: `The application theme has been changed to ${newTheme} mode.`,
    });
  }, [theme, toast]);

  const dismissNotification = useCallback((id: number) => {
    setNotifications(prev => prev.map(notif => 
      notif.id === id ? { ...notif, read: true } : notif
    ));
  }, []);

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'read' | 'timestamp'>) => {
    const newNotification = {
      ...notification,
      id: Date.now(),
      read: false,
      timestamp: new Date(),
    };
    setNotifications(prev => [newNotification, ...prev]);
    toast({
      title: notification.title,
      description: notification.message,
    });
  }, [toast]);

  const contextValue = React.useMemo(() => ({
    isAuthenticated,
    login,
    verifyOtp,
    logout,
    theme,
    toggleTheme,
    notifications,
    dismissNotification,
    addNotification,
    otpToken,
    deliveryMethod,
  }), [
    isAuthenticated,
    login,
    verifyOtp,
    logout,
    theme,
    toggleTheme,
    notifications,
    dismissNotification,
    addNotification,
    otpToken,
    deliveryMethod,
  ]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Named exports for better Fast Refresh compatibility
export { AuthProvider, useAuth };