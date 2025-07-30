
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
  const { user, logout } = useAuth();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  
  const isActive = (path: string) => {
    return location.pathname === path ? 'text-amber-500 font-bold' : 'text-blue-900';
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: 'Success',
        description: 'Logged out successfully',
      });
      navigate('/login');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to logout',
        variant: 'destructive',
      });
    }
  };
  
  return (
    <div className="flex min-h-screen bg-[#F2F2F2]">
      {/* Sidebar */}
      <div className="w-48 bg-gray-100 flex flex-col shadow-md">
        <div className="p-6 flex justify-center">
          <h1 className="text-4xl font-bold text-blue-800">SCHEDURA</h1>
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
            {/* User Profile */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                    {user?.profilePic ? (
                      <img 
                        src={user.profilePic} 
                        alt={user.username}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-gray-600 font-medium">
                        {user?.username?.charAt(0).toUpperCase() || 'A'}
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-medium">{user?.username || 'Admin'}</span>
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => navigate('/setting')}>
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setShowLogoutDialog(true)}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
        
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
              handleLogout();
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
