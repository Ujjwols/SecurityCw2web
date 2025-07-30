
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import DashboardLayout from '@/components/layout/DashboardLayout';

const Setting = () => {
  const { toast } = useToast();
  
  // Profile state
  const [profile, setProfile] = useState({
    name: 'Admin1',
    email: 'admin1@gmail.com',
    profilePhoto: 'https://randomuser.me/api/portraits/men/32.jpg',
  });
  
  // Password change state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  // Notification preferences
  const [notificationPrefs, setNotificationPrefs] = useState({
    newMemberNotification: true,
    eventReminderEmail: true,
    eventReminderSMS: false,
    monthlyReportEmail: true,
  });
  
  // Theme settings
  const [theme, setTheme] = useState('light');
  
  const handleProfilePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      
      reader.onloadend = () => {
        setProfile({
          ...profile,
          profilePhoto: reader.result as string,
        });
      };
      
      reader.readAsDataURL(file);
    }
  };
  
  const handleProfileUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Profile Updated",
      description: "Your profile information has been updated successfully.",
    });
  };
  
  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "New password and confirmation do not match.",
        variant: "destructive",
      });
      return;
    }
    
    // Reset form fields
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    
    toast({
      title: "Password Changed",
      description: "Your password has been updated successfully.",
    });
  };
  
  const handleNotificationToggle = (key: keyof typeof notificationPrefs) => {
    setNotificationPrefs({
      ...notificationPrefs,
      [key]: !notificationPrefs[key],
    });
    
    toast({
      title: "Notification Settings Updated",
      description: "Your notification preferences have been saved.",
    });
  };
  
  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    toast({
      title: "Theme Changed",
      description: `Theme has been changed to ${newTheme}.`,
    });
  };

  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Settings</h1>
      
      <div className="space-y-8">
        {/* Admin Profile Section */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="text-2xl font-bold">Admin Profile</h2>
            
            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                <div className="flex-shrink-0">
                  <img
                    src={profile.profilePhoto}
                    alt="Admin profile"
                    className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                  />
                </div>
                
                <div className="space-y-3 flex-1">
                  <div>
                    <Label htmlFor="name">Name:</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="name"
                        value={profile.name}
                        onChange={e => setProfile({ ...profile, name: e.target.value })}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="email">Email:</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="email"
                        type="email"
                        value={profile.email}
                        onChange={e => setProfile({ ...profile, email: e.target.value })}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="profilePhoto">Update Profile:</Label>
                    <div className="flex items-center justify-between mt-1">
                      <Button
                        type="submit"
                        className="bg-gray-600 hover:bg-gray-700"
                      >
                        Update Profile
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
        
        <Separator />
        
        {/* Change Password Section */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="text-2xl font-bold">Change Password</h2>
            
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="space-y-3">
                <div>
                  <Label htmlFor="currentPassword">Current Password:</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={e => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="newPassword">New Password:</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="confirmPassword">Confirm New Password:</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    required
                  />
                </div>
                
                <div>
                  <div className="flex items-center justify-start">
                    <Button
                      type="submit"
                      className="bg-gray-600 hover:bg-gray-700"
                    >
                      Change Password
                    </Button>
                  </div>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
        
        <Separator />
        
        {/* Notifications Section */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="text-2xl font-bold">Notifications</h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="newMemberNotification" className="text-base">
                    Email me when a member fill membership
                  </Label>
                </div>
                <Switch
                  id="newMemberNotification"
                  checked={notificationPrefs.newMemberNotification}
                  onCheckedChange={() => handleNotificationToggle('newMemberNotification')}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="eventReminderEmail" className="text-base">
                    Send event reminders via email
                  </Label>
                </div>
                <Switch
                  id="eventReminderEmail"
                  checked={notificationPrefs.eventReminderEmail}
                  onCheckedChange={() => handleNotificationToggle('eventReminderEmail')}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="eventReminderSMS" className="text-base">
                    Send event reminders via SMS
                  </Label>
                </div>
                <Switch
                  id="eventReminderSMS"
                  checked={notificationPrefs.eventReminderSMS}
                  onCheckedChange={() => handleNotificationToggle('eventReminderSMS')}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="monthlyReportEmail" className="text-base">
                    Send monthly activity reports
                  </Label>
                </div>
                <Switch
                  id="monthlyReportEmail"
                  checked={notificationPrefs.monthlyReportEmail}
                  onCheckedChange={() => handleNotificationToggle('monthlyReportEmail')}
                />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Separator />
        
        {/* Theme Section */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="text-2xl font-bold">Theme</h2>
            
            <div className="flex items-center gap-4">
              <Button
                type="button"
                variant={theme === 'light' ? 'default' : 'outline'}
                className={theme === 'light' ? 'bg-blue-600' : ''}
                onClick={() => handleThemeChange('light')}
              >
                Light Mode
              </Button>
              
              <Button
                type="button"
                variant={theme === 'dark' ? 'default' : 'outline'}
                className={theme === 'dark' ? 'bg-blue-900' : ''}
                onClick={() => handleThemeChange('dark')}
              >
                Dark Mode
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Setting;
