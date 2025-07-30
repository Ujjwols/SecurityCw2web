import { useState, useEffect } from 'react';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { AxiosError } from 'axios';
import api from '@/api/api';

const Index = () => {
  const [currentPage, setCurrentPage] = useState<'login' | 'forgot' | 'reset'>('login');
  const [formData, setFormData] = useState({ 
    email: '', 
    password: '', 
    otp: '', 
    newPassword: '', 
    confirmPassword: '',
    token: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isOtpStep, setIsOtpStep] = useState(false);
  const navigate = useNavigate();
  const { user, login, verifyOtp, forgotPassword, resetPassword, otpToken } = useAuth();
  const { toast } = useToast();

  // Redirect if already authenticated
  useEffect(() => {
    if (user && user.role === 'admin') {
      navigate('/');
    }
  }, [user, navigate]);

  // API is already initialized in App.tsx, no need to initialize again here

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (currentPage === 'login') {
        if (!isOtpStep) {
          // Step 1: Send OTP using useAuth hook
          const success = await login(formData.email, formData.password);
          if (success) {
            setIsOtpStep(true);
          }
        } else {
          // Step 2: Verify OTP using useAuth hook
          const success = await verifyOtp(formData.otp, otpToken || '');
          if (success) {
            // The useAuth hook will handle redirection
            return;
          }
        }
      } else if (currentPage === 'forgot') {
        const success = await forgotPassword(formData.email);
        if (success) {
          setCurrentPage('reset');
        }
      } else if (currentPage === 'reset') {
        if (formData.newPassword !== formData.confirmPassword) {
          toast({
            title: 'Error',
            description: 'Passwords do not match.',
            variant: 'destructive',
          });
          return;
        }
        if (!otpToken) {
          toast({
            title: 'Error',
            description: 'No OTP token found. Please request a new OTP.',
            variant: 'destructive',
          });
          setCurrentPage('forgot');
          return;
        }
        const success = await resetPassword(formData.otp, otpToken, formData.newPassword);
        if (success) {
          toast({
            title: 'Password Reset',
            description: 'Your password has been reset successfully.',
          });
          setFormData({ email: '', password: '', otp: '', newPassword: '', confirmPassword: '', token: '' });
          setCurrentPage('login');
        }
      }
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        toast({
          title: `${currentPage === 'login' ? 'Login' : currentPage === 'forgot' ? 'Forgot Password' : 'Password Reset'} Failed`,
          description: error.response?.data?.message || 'An error occurred.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error',
          description: 'An unexpected error occurred.',
          variant: 'destructive',
        });
      }
      console.error('Error:', error);
    }
  };

  const renderLoginPage = () => (
    <Card className="w-full max-w-md bg-white/80 backdrop-blur-sm border-blue-200 shadow-lg">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">Schedura Admin</CardTitle>
        <p className="text-muted-foreground">Sign in to your admin account</p>
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
                className="text-center text-xl tracking-widest"
                maxLength={6}
                required
              />
              <Button type="submit" className="w-full">Verify OTP</Button>
            </div>
          )}
          <div className="text-center">
            <span className="text-muted-foreground">Forgot password? </span>
            <button
              type="button"
              onClick={() => setCurrentPage('forgot')}
              className="text-primary hover:underline font-medium"
            >
              Click Here
            </button>
          </div>
        </form>
      </CardContent>
    </Card>
  );

  const renderForgotPasswordPage = () => (
    <Card className="w-full max-w-md bg-white/80 backdrop-blur-sm border-blue-200 shadow-lg">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">Schedura Admin</CardTitle>
        <p className="text-muted-foreground">Enter your email to reset password</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
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
          <Button type="submit" className="w-full">Send OTP</Button>
          <div className="text-center">
            <button
              type="button"
              onClick={() => setCurrentPage('login')}
              className="text-primary hover:underline font-medium"
            >
              Back to Login
            </button>
          </div>
        </form>
      </CardContent>
    </Card>
  );

  const renderResetPasswordPage = () => (
    <Card className="w-full max-w-md bg-white/80 backdrop-blur-sm border-blue-200 shadow-lg">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">Schedura Admin</CardTitle>
        <p className="text-muted-foreground">Reset your password</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="otp">OTP</Label>
            <Input
              id="otp"
              type="text"
              placeholder="Enter the OTP sent to your email"
              value={formData.otp}
              onChange={(e) => setFormData({ ...formData, otp: e.target.value })}
              className="text-center text-xl tracking-widest"
              maxLength={6}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                id="newPassword"
                type={showNewPassword ? 'text' : 'password'}
                placeholder="Enter new password"
                className="pl-10 pr-10"
                value={formData.newPassword}
                onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                required
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Confirm new password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              required
            />
          </div>
          <Button type="submit" className="w-full">Reset Password</Button>
          <div className="text-center">
            <button
              type="button"
              onClick={() => setCurrentPage('login')}
              className="text-primary hover:underline font-medium"
            >
              Back to Login
            </button>
          </div>
        </form>
      </CardContent>
    </Card>
  );

  const getCurrentPageComponent = () => {
    switch (currentPage) {
      case 'login':
        return renderLoginPage();
      case 'forgot':
        return renderForgotPasswordPage();
      case 'reset':
        return renderResetPasswordPage();
      default:
        return renderLoginPage();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {getCurrentPageComponent()}
      </div>
    </div>
  );
};

export default Index;