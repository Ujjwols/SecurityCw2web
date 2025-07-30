
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Bell, UserCircle, ChevronDown, LogOut, Settings, Moon, Sun, LayoutDashboard, Users, CalendarDays, ImageIcon, LogOutIcon } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { logout, theme, toggleTheme, notifications } = useAuth();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  
  const isActive = (path: string) => {
    return location.pathname === path ? 'text-amber-500 font-bold' : 'text-blue-900';
  };

  const unreadNotificationsCount = notifications.filter(n => !n.read).length;
  
  return (
    <div className="flex min-h-screen bg-[#F2F2F2]">
      {/* Sidebar */}
      <div className="w-48 bg-gray-100 flex flex-col shadow-md">
        <div className="p-6 flex justify-center">
          <h1 className="text-4xl font-bold text-blue-800">REST</h1>
        </div>
        
        <nav className="flex-1 px-4 py-6">
          <ul className="space-y-6">
            <li>
              <Link to="/" className={`flex items-center text-xl ${isActive('/')}`}>
                <LayoutDashboard className="w-5 h-5 mr-3" />
                <span>Dashboard</span>
              </Link>
            </li>
            <li>
              <Link to="/members" className={`flex items-center text-xl ${isActive('/members')}`}>
                <Users className="w-5 h-5 mr-3" />
                <span>Members</span>
              </Link>
            </li>
            <li>
              <Link to="/events" className={`flex items-center text-xl ${isActive('/events')}`}>
                <CalendarDays className="w-5 h-5 mr-3" />
                <span>Events</span>
              </Link>
            </li>
            <li>
              <Link to="/gallery" className={`flex items-center text-xl ${isActive('/gallery')}`}>
                <ImageIcon className="w-5 h-5 mr-3" />
                <span>Gallery</span>
              </Link>
            </li>
            <li>
              <Link to="/setting" className={`flex items-center text-xl ${isActive('/setting')}`}>
                <Settings className="w-5 h-5 mr-3" />
                <span>Setting</span>
              </Link>
            </li>
            <li>
              <button 
                onClick={() => setShowLogoutDialog(true)} 
                className="flex items-center text-xl text-blue-900"
              >
                <LogOutIcon className="w-5 h-5 mr-3" />
                <span>Logout</span>
              </button>
            </li>
          </ul>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <header className="bg-white border-b p-4 flex justify-between items-center">
          <div className="flex-1"></div>
          <div className="flex items-center space-x-4">
            {/* Notification Bell */}
            <Popover>
              <PopoverTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="p-2 relative"
                >
                  <Bell className="h-6 w-6" />
                  {unreadNotificationsCount > 0 && (
                    <span className="absolute top-1 right-1 bg-red-500 rounded-full w-2 h-2"></span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0">
                <div className="p-4 border-b">
                  <h3 className="font-medium">Notifications</h3>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length > 0 ? (
                    notifications.map((notification) => (
                      <div 
                        key={notification.id} 
                        className={`p-4 border-b ${notification.read ? 'bg-white' : 'bg-blue-50'}`}
                      >
                        <h4 className="font-medium">{notification.title}</h4>
                        <p className="text-sm text-gray-500">{notification.message}</p>
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-xs text-gray-400">
                            {notification.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-gray-500">
                      No notifications
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>

            {/* Profile Image */}
            <img 
              src="https://randomuser.me/api/portraits/men/32.jpg"
              alt="Admin profile" 
              className="w-8 h-8 rounded-full object-cover cursor-pointer" 
              onClick={() => navigate('/setting')}
            />
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
        
        <footer className="bg-white border-t p-2 text-center text-xs text-gray-500">
          <p>2025 REST. All Rights Reserved.</p>
        </footer>
      </div>

      {/* Logout Confirmation Dialog */}
      <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Logout</DialogTitle>
            <DialogDescription>
              Are you sure you want to log out of your account?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-between">
            <Button variant="outline" onClick={() => setShowLogoutDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => {
              setShowLogoutDialog(false);
              logout();
            }}>
              Logout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DashboardLayout;
