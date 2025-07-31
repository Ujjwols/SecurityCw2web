import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Mail, Lock, Eye, EyeOff, Camera, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { isAxiosError } from 'axios';
import api, { initializeAPI } from '../api/api';
import { AxiosApiError } from '../types';

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    profilePic: null as File | null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [passwordValidations, setPasswordValidations] = useState({
    minLength: false,
    capitalLetter: false,
    number: false,
    symbol: false,
  });

  const navigate = useNavigate();

  useEffect(() => {
    const init = async () => {
      try {
        await initializeAPI();
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize CSRF token:', error);
        toast.error('Failed to initialize. Please refresh and try again.');
      }
    };
    init();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, profilePic: file });
    }
  };

  const handlePasswordChange = (value: string) => {
    setFormData({ ...formData, password: value });
    setPasswordValidations({
      minLength: value.length >= 6,
      capitalLetter: /[A-Z]/.test(value),
      number: /\d/.test(value),
      symbol: /[!@#$%^&*]/.test(value),
    });
  };

  const passwordStrengthScore = Object.values(passwordValidations).filter(Boolean).length;
  const strengthColor =
    passwordStrengthScore === 0
      ? 'bg-gray-200'
      : passwordStrengthScore <= 2
      ? 'bg-red-500'
      : passwordStrengthScore === 3
      ? 'bg-yellow-500'
      : 'bg-green-500';

  const strengthMessage =
    passwordStrengthScore === 0
      ? 'Too short'
      : passwordStrengthScore <= 2
      ? 'Weak password'
      : passwordStrengthScore === 3
      ? 'Moderate password'
      : 'Strong password';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (!isInitialized) {
      toast.error('CSRF token not initialized. Please refresh and try again.');
      return;
    }

    setIsLoading(true);
    const form = new FormData();
    form.append('username', formData.username);
    form.append('email', formData.email);
    form.append('password', formData.password);
    if (formData.profilePic) {
      form.append('profilePic', formData.profilePic);
    }

    try {
      const { data } = await api.post('/user/register', form);
      if (data.success) {
        toast.success('Registration successful! Please log in.');
        navigate('/login');
      }
    } catch (error: unknown) {
      if (isAxiosError<AxiosApiError>(error)) {
        const message = error.response?.data?.message || 'Registration failed';
        toast.error(message);
        console.error('Registration error:', {
          message,
          status: error.response?.status,
          headers: error.response?.headers,
          data: error.response?.data,
          requestHeaders: error.config?.headers,
        });
      } else {
        toast.error('An unexpected error occurred');
        console.error('Unexpected error:', error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
          <p className="text-muted-foreground">Join EventHub today</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Profile Picture</Label>
              <div className="flex flex-col items-center gap-3">
                <Avatar className="w-20 h-20">
                  <AvatarImage
                    src={formData.profilePic ? URL.createObjectURL(formData.profilePic) : ''}
                    alt="Profile"
                  />
                  <AvatarFallback className="text-lg">
                    <Camera className="w-8 h-8 text-muted-foreground" />
                  </AvatarFallback>
                </Avatar>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('profilePicInput')?.click()}
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Upload Photo
                </Button>
                <input
                  id="profilePicInput"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  id="username"
                  placeholder="Enter your username"
                  className="pl-10"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                />
              </div>
            </div>

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
                  placeholder="Create a password"
                  className="pl-10 pr-10"
                  value={formData.password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
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

              {formData.password && (
                <div className="space-y-2">
                  <div className="h-2 rounded-full overflow-hidden bg-gray-200">
                    <div className={`h-full ${strengthColor}`} style={{ width: `${passwordStrengthScore * 25}%` }} />
                  </div>
                  <p className="text-sm text-gray-600">{strengthMessage}</p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className={`w-4 h-4 ${passwordValidations.minLength ? "text-green-500" : "text-gray-400"}`} />
                      At least 6 characters
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className={`w-4 h-4 ${passwordValidations.capitalLetter ? "text-green-500" : "text-gray-400"}`} />
                      One uppercase letter
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className={`w-4 h-4 ${passwordValidations.number ? "text-green-500" : "text-gray-400"}`} />
                      One number
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className={`w-4 h-4 ${passwordValidations.symbol ? "text-green-500" : "text-gray-400"}`} />
                      One special character (!@#$%^&*)
                    </li>
                  </ul>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm your password"
                  className="pl-10 pr-10"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading || !isInitialized}>
              {isLoading ? 'Registering...' : 'Create Account'}
            </Button>
          </form>
          <div className="mt-6 text-center">
            <p className="text-muted-foreground">
              Already have an account?{' '}
              <Link to="/login" className="text-primary hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Register;
