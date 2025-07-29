import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { toast } from 'react-toastify';
import { isAxiosError } from 'axios';
import api, { initializeAPI } from '../api/api';
import { AxiosApiError } from '../types';

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '', otp: '', token: '' });
  const [isOtpStep, setIsOtpStep] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    initializeAPI().catch((error) => {
      console.error('Failed to initialize API:', error);
      toast.error('Failed to initialize CSRF token');
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form data before request:', formData);
    try {
      if (!isOtpStep) {
        const { data } = await api.post('/user/send-otp', {
          email: formData.email,
          password: formData.password,
          deliveryMethod: 'email',
        });
        console.log('Response data:', data);
        if (data.success) {
          setFormData({ ...formData, token: data.data.token });
          setIsOtpStep(true);
          toast.success('OTP sent to your email');
        }
      } else {
        const { data } = await api.post('/user/verify-otp', {
          token: formData.token,
          otp: formData.otp,
        });
        if (data.success) {
          if (data.data.needsPasswordUpdate) {
            toast.info('Your password is older than 90 days. Please update it.');
            navigate(`/update-password/${data.data.userId}`);
          } else {
            toast.success('Login successful');
            navigate('/profile');
          }
        }
      }
    } catch (error: unknown) {
      if (isAxiosError<AxiosApiError>(error)) {
        toast.error(error.response?.data?.message || 'An error occurred during login');
        console.error('Login error:', error);
      } else {
        toast.error('An unexpected error occurred');
        console.error('Unexpected error:', error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
          <p className="text-muted-foreground">Sign in to your account</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isOtpStep ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      className="pl-10"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      className="pl-10 pr-10"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="w-full">Send OTP</Button>
              </>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="otp">OTP</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="Enter the OTP sent to your email"
                  value={formData.otp}
                  onChange={(e) => setFormData({ ...formData, otp: e.target.value })}
                  required
                />
                <Button type="submit" className="w-full">Verify OTP</Button>
              </div>
            )}
          </form>
          <div className="mt-6 text-center">
            <p className="text-muted-foreground">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary hover:underline font-medium">
                Sign up
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;