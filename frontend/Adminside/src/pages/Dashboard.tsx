import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import DashboardLayout from '@/components/layout/DashboardLayout';
import NepaliCalendar from '@/components/NepaliCalendar';
import { useAuth } from '@/context/AuthContext';
import { CalendarDays, MapPin, Loader2, Users, UserPlus, Calendar, TrendingUp, FileText } from 'lucide-react';
import api from '@/api/api';
import { format, parseISO, subDays } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { AxiosError } from 'axios';

interface Event {
  _id: string;
  title: string;
  date?: string;
  time?: string;
  location?: string;
  description: string;
  files?: { url: string; type: string }[];
  createdAt: string;
}

interface User {
  _id: string;
  username: string;
  email: string;
  role: string;
  createdAt: string;
  profilePic?: string;
}

const Dashboard = () => {
  const { user: adminUser, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [currentMonth] = useState(format(new Date(), 'MMMM/yyyy'));
  const [totalUsers, setTotalUsers] = useState(0);
  const [newUsers, setNewUsers] = useState(0);
  const [upcomingEventsCount, setUpcomingEventsCount] = useState(0);
  const [completedEventsCount, setCompletedEventsCount] = useState(0);
  const [recentUsers, setRecentUsers] = useState<User[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [noEventMessage, setNoEventMessage] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!adminUser) {
      toast({
        title: 'Unauthorized',
        description: 'Please log in to view dashboard.',
        variant: 'destructive',
      });
      window.location.href = '/login';
      return;
    }
    if (adminUser.role !== 'admin') {
      toast({
        title: 'Access Denied',
        description: 'Only admin users can access this page.',
        variant: 'destructive',
      });
      window.location.href = '/login';
      return;
    }

    // API is already initialized in App.tsx, no need to initialize again here

    fetchDashboardData();
  }, [adminUser, authLoading, toast]);

 const fetchDashboardData = async () => {
  try {
    setLoading(true);
    setError('');

    // Define response interfaces
    interface EventApiResponse {
      success: boolean;
      data: {
        events: Event[];
        pagination: {
          currentPage: number;
          totalPages: number;
          totalEvents: number;
          limit: number;
        };
      };
      message: string;
    }

    interface UserApiResponse {
      success: boolean;
      data: User[]; // Adjust if /user/get-all-users returns { users: User[], pagination: {...} }
      message: string;
    }

    // Fetch events and users in parallel
    const [eventsResponse, usersResponse] = await Promise.all([
      api.get<EventApiResponse>('/event/get-all-event'),
      api.get<UserApiResponse>('/user/get-all-users'),
    ]);

    console.log('Events Response:', eventsResponse.data);
    console.log('Users Response:', usersResponse.data);

    if (eventsResponse.data.success && usersResponse.data.success) {
      const eventsData = Array.isArray(eventsResponse.data.data.events)
        ? eventsResponse.data.data.events
        : [];
      const usersData = Array.isArray(usersResponse.data.data)
        ? usersResponse.data.data
        : [];

      // Calculate event counts with timezone handling
      const now = new Date();
      const offsetMs = 5 * 60 * 60 * 1000 + 45 * 60 * 1000; // +05:45
      const adjustedNow = new Date(now.getTime() + offsetMs);

      const upcoming = eventsData.filter((event) => {
        if (!event.date || !event.time) return false;
        try {
          const eventDateTime = new Date(`${event.date}T${event.time}:00+05:45`);
          return eventDateTime > adjustedNow && !isNaN(eventDateTime.getTime());
        } catch {
          console.warn(`Invalid date/time for event: ${event.title}`);
          return false;
        }
      }).sort((a, b) => new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime());

      const completed = eventsData.filter((event) => {
        if (!event.date || !event.time) return false;
        try {
          const eventDateTime = new Date(`${event.date}T${event.time}:00+05:45`);
          return eventDateTime <= adjustedNow && !isNaN(eventDateTime.getTime());
        } catch {
          console.warn(`Invalid date/time for event: ${event.title}`);
          return false;
        }
      });

      setEvents(eventsData);
      setUpcomingEventsCount(upcoming.length);
      setCompletedEventsCount(completed.length);

      // Calculate user statistics
      const fiveDaysAgo = subDays(adjustedNow, 5);
      const allUsers = usersData.filter((user) => user.role === 'user');
      const newUsersCount = allUsers.filter((user) => {
        try {
          return new Date(user.createdAt) > fiveDaysAgo && !isNaN(new Date(user.createdAt).getTime());
        } catch {
          console.warn(`Invalid createdAt for user: ${user._id}`);
          return false;
        }
      }).length;
      const recentUsersList = allUsers
        .filter((user) => {
          try {
            return new Date(user.createdAt) > fiveDaysAgo && !isNaN(new Date(user.createdAt).getTime());
          } catch {
            console.warn(`Invalid createdAt for user: ${user._id}`);
            return false;
          }
        })
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);

      setTotalUsers(allUsers.length);
      setNewUsers(newUsersCount);
      setRecentUsers(recentUsersList);

      toast({
        title: 'Welcome Back',
        description: 'Dashboard data loaded successfully',
      });
    } else {
      throw new Error('API response indicates failure');
    }
  } catch (error: unknown) {
    console.error('Fetch Dashboard Data Error:', error);
    const errorMessage = error instanceof AxiosError
      ? error.response?.status === 401
        ? 'Please log in to view dashboard data.'
        : error.response?.data?.message || 'Failed to fetch dashboard data'
      : 'An unexpected error occurred';
    setError(errorMessage);
    toast({
      title: 'Error',
      description: errorMessage,
      variant: 'destructive',
    });
  } finally {
    setLoading(false);
  }
};
  const handleDateClick = async (date: string) => {
    const formattedDate = format(new Date(date), 'yyyy-MM-dd');
    const matchingEvents = events.filter(
      (event) => event.date && format(new Date(event.date), 'yyyy-MM-dd') === formattedDate
    );

    if (matchingEvents.length > 0) {
      try {
        const eventId = matchingEvents[0]._id;
        const response = await api.get<{ success: boolean; data: Event; message: string }>(
          `/event/get-event/${eventId}`
        );
        
        if (response.data.success) {
          setSelectedEvent(response.data.data);
          setNoEventMessage('');
          setIsDialogOpen(true);
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof AxiosError
          ? error.response?.data?.message || 'Failed to fetch event details'
          : 'An unexpected error occurred';
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    } else {
      setSelectedEvent(null);
      setNoEventMessage(`No event on ${format(new Date(date), 'MMMM d, yyyy')}`);
      setIsDialogOpen(true);
    }
  };

  if (authLoading || loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="animate-spin h-8 w-8 text-blue-500" />
        </div>
      </DashboardLayout>
    );
  }

  if (!adminUser || adminUser.role !== 'admin') {
    return null;
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="text-red-500 text-center p-4">{error}</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-[#1E4E9D] mb-2">Welcome Back, {adminUser.username}</h1>
          <p className="text-gray-600">Welcome to your Schedura admin dashboard</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            title="Total Users" 
            value={totalUsers} 
            icon={<Users className="w-5 h-5" />}
            bgColor="bg-green-50"
            iconColor="text-green-600"
          />
          <StatCard 
            title="New Users (5 days)" 
            value={newUsers} 
            icon={<UserPlus className="w-5 h-5" />}
            bgColor="bg-blue-50"
            iconColor="text-blue-600"
          />
          <StatCard 
            title="Upcoming Events" 
            value={upcomingEventsCount} 
            icon={<CalendarDays className="w-5 h-5" />}
            bgColor="bg-purple-50"
            iconColor="text-purple-600"
          />
          <StatCard 
            title="Completed Events" 
            value={completedEventsCount} 
            icon={<Calendar className="w-5 h-5" />}
            bgColor="bg-amber-50"
            iconColor="text-amber-600"
          />
        </div>

        {/* Recent Users and Upcoming Events */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Users Card */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-medium text-[#1E4E9D] mb-4">Recent Users</h2>
              {recentUsers.length > 0 ? (
                <div className="space-y-4">
                  {recentUsers.map((user) => (
                    <div key={user._id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                          {user.profilePic ? (
                            <img 
                              src={user.profilePic} 
                              alt={user.username}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-gray-600 font-medium">
                              {user.username.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div>
                          <h3 className="font-medium">{user.username}</h3>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        {format(new Date(user.createdAt), 'MMM d, yyyy')}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No recent users</p>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Events Card */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-medium text-[#1E4E9D] mb-4">Upcoming Events</h2>
              {upcomingEventsCount > 0 ? (
                <div className="space-y-4">
                  {events
                    .filter((event) => {
                      if (!event.date || !event.time) return false;
                      const eventDateTime = new Date(`${event.date}T${event.time}:00`);
                      const now = new Date();
                      return eventDateTime > now;
                    })
                    .sort((a, b) => new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime())
                    .slice(0, 3)
                    .map((event) => (
                      <EventCard key={event._id} event={event} />
                    ))}
                </div>
              ) : (
                <p className="text-gray-500">No upcoming events</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Calendar Section */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-medium text-[#1E4E9D] mb-4">Calendar</h2>
            <NepaliCalendar events={events} onDateClick={handleDateClick} />
          </CardContent>
        </Card>

        {/* Event Details Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {selectedEvent ? selectedEvent.title : 'No Event'}
              </DialogTitle>
              <DialogDescription>
                {selectedEvent ? (
                  <div className="space-y-4 mt-4">
                    <p>{selectedEvent.description}</p>
                    <div className="grid grid-cols-2 gap-4">
                      {selectedEvent.date && (
                        <div>
                          <h4 className="font-medium">Date</h4>
                          <p>{format(new Date(selectedEvent.date), 'MMMM d, yyyy')}</p>
                        </div>
                      )}
                      {selectedEvent.time && (
                        <div>
                          <h4 className="font-medium">Time</h4>
                          <p>{format(new Date(`${selectedEvent.date}T${selectedEvent.time}`), 'h:mm a')}</p>
                        </div>
                      )}
                      {selectedEvent.location && (
                        <div className="col-span-2">
                          <h4 className="font-medium">Location</h4>
                          <p>{selectedEvent.location}</p>
                        </div>
                      )}
                    </div>
                    {selectedEvent.files && selectedEvent.files.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Attachments</h4>
                        <div className="space-y-2">
                          {selectedEvent.files.map((file, index) => (
                            <a
                              key={index}
                              href={file.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center text-blue-600 hover:underline"
                            >
                              <FileText className="w-4 h-4 mr-2" />
                              <span className="truncate">{file.url.split('/').pop()}</span>
                              <span className="ml-2 text-xs text-gray-500">({file.type})</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="mt-4">{noEventMessage}</p>
                )}
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

// Helper component for stat cards
const StatCard = ({ title, value, icon, bgColor, iconColor }: {
  title: string;
  value: number;
  icon: React.ReactNode;
  bgColor: string;
  iconColor: string;
}) => (
  <Card className={bgColor}>
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium text-gray-700">{title}</h2>
          <p className="text-3xl font-bold mt-2">{value}</p>
        </div>
        <div className={`p-3 rounded-full ${bgColor.replace('50', '100')} ${iconColor}`}>
          {icon}
        </div>
      </div>
    </CardContent>
  </Card>
);

// Helper component for event cards
const EventCard = ({ event }: { event: Event }) => (
  <Card className="border border-gray-200 hover:shadow-md transition-shadow">
    <CardContent className="p-4">
      <div className="flex items-start space-x-3">
        <div className="flex flex-col items-center bg-[#1E4E9D] text-white rounded-lg p-3 min-w-[60px]">
          <span className="text-lg font-bold">
            {event.date ? format(new Date(event.date), 'dd') : '--'}
          </span>
          <span className="text-xs uppercase">
            {event.date ? format(new Date(event.date), 'MMM') : '---'}
          </span>
        </div>
        <div className="flex-1">
          <h3 className="font-medium text-gray-900 mb-2">{event.title}</h3>
          <p className="text-gray-500 text-sm line-clamp-2 mb-1">{event.description}</p>
          {event.location && (
            <div className="flex items-center text-gray-500 text-sm mb-1">
              <MapPin className="w-4 h-4 mr-1" />
              <span>{event.location}</span>
            </div>
          )}
          {event.date && event.time && (
            <div className="flex items-center text-gray-500 text-sm">
              <CalendarDays className="w-4 h-4 mr-1" />
              <span>{format(new Date(`${event.date}T${event.time}`), 'h:mm a')}</span>
            </div>
          )}
        </div>
      </div>
    </CardContent>
  </Card>
);

export default Dashboard;