import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import api from '@/api/api';
import { AxiosError } from 'axios';

const VerifyOtp = () => {
  const [otp, setOtp] = useState('');
  const { verifyOtp, otpToken } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // API is already initialized in App.tsx, no need to initialize again here

  useEffect(() => {
    if (!otpToken) {
      toast({
        title: 'Session Expired',
        description: 'Please log in again to receive an OTP.',
        variant: 'destructive',
      });
      navigate('/login');
    }
  }, [otpToken, navigate, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpToken) {
      toast({
        title: 'Error',
        description: 'No OTP token found. Please log in again.',
        variant: 'destructive',
      });
      return;
    }
    try {
      const success = await verifyOtp(otp, otpToken);
      if (success) {
        toast({
          title: 'OTP Verified',
          description: 'You have successfully verified your OTP.',
        });
        // Navigation handled in useAuth.ts
      }
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
          description: 'An unexpected error occurred.',
          variant: 'destructive',
        });
      }
      console.error('OTP verification error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="w-full bg-white/80 backdrop-blur-sm border-blue-200 shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Schedura Admin</CardTitle>
            <p className="text-muted-foreground">Enter OTP</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp">OTP</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="Enter the OTP sent to your email"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="text-center text-xl tracking-widest"
                  maxLength={6}
                  required
                />
              </div>
              <Button type="submit" className="w-full">Verify OTP</Button>
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="text-primary hover:underline font-medium"
                >
                  Back to Login
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
        <div className="mt-8 text-center">
          <div className="flex justify-end space-x-4 mb-4">
            <button className="text-blue-600 hover:text-blue-800 transition-colors">
              Contact
            </button>
            <button className="text-blue-600 hover:text-blue-800 transition-colors">
              Help
            </button>
          </div>
          <p className="text-blue-600 text-sm">
            2025 REST. All Rights Reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default VerifyOtp;