import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Mail, Settings } from 'lucide-react';
import { toast } from 'react-toastify';
import useAuth from '../hooks/useAuth';
import api from '../api/api';

interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  image: string;
  attendees: number;
  price: number;
  category: string;
}

const Profile = () => {
  const { user, loading, logout } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const { data } = await api.get('/user/events'); // Placeholder endpoint
        if (data.success) {
          setEvents(data.data);
        }
      } catch (error) {
        toast.error('Failed to fetch events');
        console.error('Events fetch error:', error);
      }
    };
    if (user) fetchEvents();
  }, [user]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center">Please log in to view your profile.</div>;
  }

  const handleEditProfile = async () => {
    toast.info('Edit profile functionality not implemented yet');
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <Card className="mb-8">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex flex-col items-center md:items-start">
                <Avatar className="w-32 h-32 mb-4">
                  <AvatarImage src={user.profilePic} alt={user.username} />
                  <AvatarFallback className="text-2xl">
                    {user.username.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <Button variant="outline" className="w-full md:w-auto" onClick={handleEditProfile}>
                  <Settings className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
                <Button variant="destructive" className="w-full md:w-auto mt-2" onClick={logout}>
                  Logout
                </Button>
              </div>
              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-4">
                  <div>
                    <h1 className="text-3xl font-bold text-foreground mb-2">{user.username}</h1>
                    <p className="text-muted-foreground mb-4">EventHub {user.role}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Mail className="w-4 h-4" />
                    <span>{user.email}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="events" className="w-full">
          <TabsList className="grid w-full grid-cols-1">
            <TabsTrigger value="events" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              My Events
            </TabsTrigger>
          </TabsList>
          <TabsContent value="events" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Registered Events</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {events.map((event) => (
                    <div key={event.id} className="border p-4 rounded-lg">
                      <img src={event.image} alt={event.title} className="w-full h-32 object-cover mb-2" />
                      <h3 className="text-lg font-bold">{event.title}</h3>
                      <p>{event.date} at {event.time}</p>
                      <p>{event.location}</p>
                      <p>{event.attendees} attendees</p>
                      <p>${event.price}</p>
                      <p>{event.category}</p>
                    </div>
                  ))}
                </div>
                {events.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No events registered yet.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Profile;