// import React, { useState, useEffect } from 'react';
// import { Card, CardContent } from '@/components/ui/card';
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
// import DashboardLayout from '@/components/layout/DashboardLayout';
// import NepaliCalendar from '@/components/NepaliCalendar';
// import { useAuth } from '@/context/AuthContext';
// import { CalendarDays, MapPin, Loader2, Users, UserPlus } from 'lucide-react';
// import axios, { AxiosError } from 'axios';
// import { format, parseISO, subDays } from 'date-fns';
// import { useToast } from '@/hooks/use-toast';

// const API_BASE_URL = import.meta.env.VITE_API_URL;

// interface RawEvent {
//   _id: string;
//   title: string;
//   date?: string;
//   time?: string;
//   location?: string;
//   description: string;
//   files?: { url: string; type: string }[];
// }

// interface Event {
//   _id: string;
//   title: string;
//   date?: string;
//   time?: string;
//   location?: string;
//   description: string;
//   files?: { url: string; type: string }[];
// }

// interface User {
//   _id: string;
//   username: string;
//   email: string;
//   role: string;
//   createdAt: string;
//   employeeId: string;
//   membershipNumber: string;
// }

// const Dashboard = () => {
//   const { notifications, addNotification } = useAuth();
//   const { toast } = useToast();
//   const [currentMonth] = useState(format(new Date(), 'MMMM/yyyy'));
//   const [totalRetired, setTotalRetired] = useState(0);
//   const [newMembers, setNewMembers] = useState(0);
//   const [upcomingEventsCount, setUpcomingEventsCount] = useState(0);
//   const [completedEventsCount, setCompletedEventsCount] = useState(0);
//   const [recentMembers, setRecentMembers] = useState<User[]>([]);
//   const [events, setEvents] = useState<Event[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');
//   const [isDialogOpen, setIsDialogOpen] = useState(false);
//   const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
//   const [noEventMessage, setNoEventMessage] = useState('');

//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         setLoading(true);
        
//         // Fetch events and users in parallel
//         const [eventsResponse, usersResponse] = await Promise.all([
//           axios.get(`${API_BASE_URL}/api/v1/event/get-all-event`, { withCredentials: true }),
//           axios.get(`${API_BASE_URL}/api/v1/user/get-all-users`, { withCredentials: true })
//         ]);

//         // Process events
//         const normalizedEvents: Event[] = eventsResponse.data.data.map((event: RawEvent) => ({
//           _id: event._id,
//           title: event.title,
//           date: event.date,
//           time: event.time,
//           location: event.location,
//           description: event.description,
//           files: event.files,
//         }));

//         // Calculate event counts
//         const now = new Date();
//         const offsetMs = 5 * 60 * 60 * 1000 + 45 * 60 * 1000; // +0545
//         const adjustedNow = new Date(now.getTime() + offsetMs);

//         const upcoming = normalizedEvents
//           .filter((event) => event.date && new Date(`${event.date}T${event.time || '00:00'}:00+05:45`) > adjustedNow)
//           .sort((a, b) => new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime());

//         const completed = normalizedEvents.filter(
//           (event) => event.date && new Date(`${event.date}T${event.time || '00:00'}:00+05:45`) <= adjustedNow
//         );

//         setEvents(normalizedEvents);
//         setUpcomingEventsCount(upcoming.length);
//         setCompletedEventsCount(completed.length);

//         // Process users
//         const allUsers: User[] = usersResponse.data.data || [];
//         const fiveDaysAgo = subDays(new Date(), 5);

//         const retiredCount = allUsers.filter(user => user.role === 'user').length;
//         const newMembersCount = allUsers.filter(user => 
//           new Date(user.createdAt) > fiveDaysAgo
//         ).length;
//         const recentMembersList = allUsers
//           .filter(user => 
//             user.role === 'user' && 
//             new Date(user.createdAt) > fiveDaysAgo
//           )
//           .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
//           .slice(0, 5);

//         setTotalRetired(retiredCount);
//         setNewMembers(newMembersCount);
//         setRecentMembers(recentMembersList);

//         addNotification({
//           title: 'Welcome Back',
//           message: 'Welcome to your REST admin dashboard',
//         });
//       } catch (error: unknown) {
//         if (error instanceof AxiosError) {
//           setError(error.response?.data?.message || 'Failed to fetch data');
//           toast({
//             title: 'Error',
//             description: error.response?.data?.message || 'Could not load data',
//             variant: 'destructive',
//           });
//         } else {
//           setError('An unexpected error occurred');
//           toast({
//             title: 'Error',
//             description: 'An unexpected error occurred while loading data',
//             variant: 'destructive',
//           });
//         }
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchData();
//   }, [addNotification, toast]);

//   const handleDateClick = async (date: string) => {
//     const formattedDate = format(new Date(date), 'yyyy-MM-dd');
//     const matchingEvents = events.filter(
//       (event) => event.date && format(new Date(event.date), 'yyyy-MM-dd') === formattedDate
//     );

//     if (matchingEvents.length > 0) {
//       try {
//         const eventId = matchingEvents[0]._id;
//         const response = await axios.get(`${API_BASE_URL}/api/v1/event/get-event/${eventId}`, {
//           withCredentials: true,
//         });
//         const eventData: RawEvent = response.data.data;
//         setSelectedEvent({
//           _id: eventData._id,
//           title: eventData.title,
//           date: eventData.date,
//           time: eventData.time,
//           location: eventData.location,
//           description: eventData.description,
//           files: eventData.files,
//         });
//         setNoEventMessage('');
//         setIsDialogOpen(true);
//       } catch (error: unknown) {
//         const errorMessage = error instanceof AxiosError
//           ? error.response?.data?.message || 'Failed to fetch event details'
//           : 'An unexpected error occurred';
//         toast({
//           title: 'Error',
//           description: errorMessage,
//           variant: 'destructive',
//         });
//       }
//     } else {
//       setSelectedEvent(null);
//       setNoEventMessage(`No event on ${format(new Date(date), 'MMMM d, yyyy')}`);
//       setIsDialogOpen(true);
//     }
//   };

//   if (loading) {
//     return (
//       <DashboardLayout>
//         <div className="flex justify-center items-center h-64">
//           <Loader2 className="animate-spin h-8 w-8 text-blue-500" />
//         </div>
//       </DashboardLayout>
//     );
//   }

//   if (error) {
//     return (
//       <DashboardLayout>
//         <div className="text-red-500 text-center p-4">{error}</div>
//       </DashboardLayout>
//     );
//   }

//   return (
//     <DashboardLayout>
//       <div className="space-y-6">
//         <div>
//           <h1 className="text-3xl font-bold text-[#1E4E9D] mb-2">Welcome Back</h1>
//           <p className="text-gray-600">Welcome to your REST admin dashboard</p>
//         </div>

//         {/* Stats Cards */}
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//           <StatCard 
//             title="Total Retired Employees" 
//             value={totalRetired} 
//             icon={<Users className="w-5 h-5" />}
//             bgColor="bg-green-50"
//             iconColor="text-green-600"
//           />
//           <StatCard 
//             title="New Members (5 days)" 
//             value={newMembers} 
//             icon={<UserPlus className="w-5 h-5" />}
//             bgColor="bg-blue-50"
//             iconColor="text-blue-600"
//           />
//           <StatCard 
//             title="Upcoming Events" 
//             value={upcomingEventsCount} 
//             icon={<CalendarDays className="w-5 h-5" />}
//             bgColor="bg-purple-50"
//             iconColor="text-purple-600"
//           />
//           <StatCard 
//             title="Completed Events" 
//             value={completedEventsCount} 
//             icon={<CalendarDays className="w-5 h-5" />}
//             bgColor="bg-amber-50"
//             iconColor="text-amber-600"
//           />
//         </div>

//         {/* Recent Members and Upcoming Events */}
//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//           {/* Recent Members Card */}
//           <Card>
//             <CardContent className="p-6">
//               <h2 className="text-xl font-medium text-[#1E4E9D] mb-4">Recent Members</h2>
//               {recentMembers.length > 0 ? (
//                 <div className="space-y-4">
//                   {recentMembers.map((member) => (
//                     <div key={member._id} className="flex items-center justify-between p-3 border rounded-lg">
//                       <div>
//                         <h3 className="font-medium">{member.username}</h3>
//                         <p className="text-sm text-gray-500">{member.employeeId}</p>
//                       </div>
//                       <div className="text-sm text-gray-500">
//                         {format(new Date(member.createdAt), 'MMM d, yyyy')}
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               ) : (
//                 <p className="text-gray-500">No recent members</p>
//               )}
//             </CardContent>
//           </Card>

//           {/* Upcoming Events Card */}
//           <Card>
//             <CardContent className="p-6">
//               <h2 className="text-xl font-medium text-[#1E4E9D] mb-4">Upcoming Events</h2>
//               {upcomingEventsCount > 0 ? (
//                 <div className="space-y-4">
//                   {events
//                     .filter((event) => {
//                       if (!event.date || !event.time) return false;
//                       const eventDateTime = new Date(`${event.date}T${event.time}:00+05:45`);
//                       const now = new Date();
//                       const offsetMs = 5 * 60 * 60 * 1000 + 45 * 60 * 1000;
//                       const adjustedNow = new Date(now.getTime() + offsetMs);
//                       return eventDateTime > adjustedNow;
//                     })
//                     .sort((a, b) => new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime())
//                     .slice(0, 3)
//                     .map((event) => (
//                       <EventCard key={event._id} event={event} />
//                     ))}
//                 </div>
//               ) : (
//                 <p className="text-gray-500">No upcoming events</p>
//               )}
//             </CardContent>
//           </Card>
//         </div>

//         {/* Calendar Section */}
//         <Card>
//           <CardContent className="p-6">
//             <h2 className="text-xl font-medium text-[#1E4E9D] mb-4">Calendar</h2>
//             <NepaliCalendar events={events} onDateClick={handleDateClick} />
//           </CardContent>
//         </Card>

//         {/* Event Details Dialog */}
//         <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
//           <DialogContent>
//             <DialogHeader>
//               <DialogTitle>
//                 {selectedEvent ? selectedEvent.title : 'No Event'}
//               </DialogTitle>
//               <DialogDescription>
//                 {selectedEvent ? (
//                   <div className="space-y-4 mt-4">
//                     <p>{selectedEvent.description}</p>
//                     <div className="grid grid-cols-2 gap-4">
//                       {selectedEvent.date && (
//                         <div>
//                           <h4 className="font-medium">Date</h4>
//                           <p>{format(new Date(selectedEvent.date), 'MMMM d, yyyy')}</p>
//                         </div>
//                       )}
//                       {selectedEvent.time && (
//                         <div>
//                           <h4 className="font-medium">Time</h4>
//                           <p>{format(new Date(`${selectedEvent.date}T${selectedEvent.time}`), 'h:mm a')}</p>
//                         </div>
//                       )}
//                       {selectedEvent.location && (
//                         <div className="col-span-2">
//                           <h4 className="font-medium">Location</h4>
//                           <p>{selectedEvent.location}</p>
//                         </div>
//                       )}
//                     </div>
//                     {selectedEvent.files && selectedEvent.files.length > 0 && (
//                       <div>
//                         <h4 className="font-medium mb-2">Attachments</h4>
//                         <div className="space-y-2">
//                           {selectedEvent.files.map((file, index) => (
//                             <a
//                               key={index}
//                               href={file.url}
//                               target="_blank"
//                               rel="noopener noreferrer"
//                               className="flex items-center text-blue-600 hover:underline"
//                             >
//                               <span className="truncate">{file.url.split('/').pop()}</span>
//                               <span className="ml-2 text-xs text-gray-500">({file.type})</span>
//                             </a>
//                           ))}
//                         </div>
//                       </div>
//                     )}
//                   </div>
//                 ) : (
//                   <p className="mt-4">{noEventMessage}</p>
//                 )}
//               </DialogDescription>
//             </DialogHeader>
//           </DialogContent>
//         </Dialog>
//       </div>
//     </DashboardLayout>
//   );
// };

// // Helper component for stat cards
// const StatCard = ({ title, value, icon, bgColor, iconColor }: {
//   title: string;
//   value: number;
//   icon: React.ReactNode;
//   bgColor: string;
//   iconColor: string;
// }) => (
//   <Card className={bgColor}>
//     <CardContent className="p-6">
//       <div className="flex items-center justify-between">
//         <div>
//           <h2 className="text-lg font-medium text-gray-700">{title}</h2>
//           <p className="text-3xl font-bold mt-2">{value}</p>
//         </div>
//         <div className={`p-3 rounded-full ${bgColor.replace('50', '100')} ${iconColor}`}>
//           {icon}
//         </div>
//       </div>
//     </CardContent>
//   </Card>
// );

// // Helper component for event cards
// const EventCard = ({ event }: { event: Event }) => (
//   <Card className="border border-gray-200 hover:shadow-md transition-shadow">
//     <CardContent className="p-4">
//       <div className="flex items-start space-x-3">
//         <div className="flex flex-col items-center bg-[#1E4E9D] text-white rounded-lg p-3 min-w-[60px]">
//           <span className="text-lg font-bold">
//             {event.date ? format(new Date(event.date), 'dd') : '--'}
//           </span>
//           <span className="text-xs uppercase">
//             {event.date ? format(new Date(event.date), 'MMM') : '---'}
//           </span>
//         </div>
//         <div className="flex-1">
//           <h3 className="font-medium text-gray-900 mb-2">{event.title}</h3>
//           <p className="text-gray-500 text-sm line-clamp-2 mb-1">{event.description}</p>
//           {event.location && (
//             <div className="flex items-center text-gray-500 text-sm mb-1">
//               <MapPin className="w-4 h-4 mr-1" />
//               <span>{event.location}</span>
//             </div>
//           )}
//           {event.date && event.time && (
//             <div className="flex items-center text-gray-500 text-sm">
//               <CalendarDays className="w-4 h-4 mr-1" />
//               <span>{format(new Date(`${event.date}T${event.time}`), 'h:mm a')}</span>
//             </div>
//           )}
//         </div>
//       </div>
//     </CardContent>
//   </Card>
// );

// export default Dashboard;