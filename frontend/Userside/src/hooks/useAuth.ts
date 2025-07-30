import { useState, useEffect } from 'react';
import api from '../api/api';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data } = await api.get('/user/get-current-user');
        if (data.success) {
          setUser(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch user:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const logout = async () => {
    try {
      const { data } = await api.post('/user/logout');
      if (data.success) {
        setUser(null);
        toast.success('Logged out successfully');
        navigate('/login');
      }
    } catch (error) {
      toast.error('Logout failed');
      console.error('Logout error:', error);
    }
  };

  return { user, loading, logout };
};

export default useAuth;