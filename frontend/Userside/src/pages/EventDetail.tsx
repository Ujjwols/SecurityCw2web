import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Calendar, MapPin, Users, Clock, Tag, Mail, ArrowLeft, Share2, Heart, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import api, { initializeAPI } from "@/api/api";
import { AxiosError } from "axios";

interface Event {
  _id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  files?: {
    url: string;
    type: string;
  }[];
  createdAt: string;
}

const EventDetail = () => {
  const { id } = useParams();
  const { toast } = useToast();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);

  useEffect(() => {
    const fetchEvent = async () => {
      if (!id) return;
      
      try {
        await initializeAPI();
        const response = await api.get<{ success: boolean; data: Event; message: string }>(
          `/event/get-event/${id}`
        );
        if (response.data.success) {
          setEvent(response.data.data);
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof AxiosError
          ? error.response?.data?.message || 'Failed to fetch event'
          : 'An unexpected error occurred';
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [id, toast]);

  const handleRegister = () => {
    setIsRegistered(!isRegistered);
    toast({
      title: isRegistered ? "Registration Cancelled" : "Successfully Registered!",
      description: isRegistered 
        ? "You have been removed from this event."
        : "You have been registered for this event. Check your email for confirmation.",
    });
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: "Link Copied!",
      description: "Event link has been copied to your clipboard.",
    });
  };

  const handleFavorite = () => {
    setIsFavorited(!isFavorited);
    toast({
      title: isFavorited ? "Removed from Favorites" : "Added to Favorites",
      description: isFavorited 
        ? "Event removed from your favorites."
        : "Event added to your favorites.",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading event...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-foreground mb-4">Event Not Found</h1>
          <p className="text-muted-foreground mb-6">The event you're looking for doesn't exist.</p>
          <Link to="/events">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Events
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const eventImage = event.files && event.files.length > 0 ? event.files[0].url : undefined;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative">
        <div className="h-96 overflow-hidden">
          {eventImage ? (
            <img
              src={eventImage}
              alt={event.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
              <div className="text-white text-center">
                <Calendar className="w-16 h-16 mx-auto mb-4" />
                <h2 className="text-2xl font-bold">{event.title}</h2>
              </div>
            </div>
          )}
          <div className="absolute inset-0 bg-black/40"></div>
        </div>
        <div className="absolute inset-0 flex items-end">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 w-full">
            <div className="text-white">
              <Link to="/events" className="inline-flex items-center text-white/80 hover:text-white mb-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Events
              </Link>
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge variant="secondary" className="bg-primary text-primary-foreground">
                  Event
                </Badge>
              </div>
              <h1 className="text-4xl lg:text-6xl font-bold mb-4">
                {event.title}
              </h1>
              <div className="flex flex-wrap items-center gap-6 text-white/90">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5" />
                  <span>{event.date}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="w-5 h-5" />
                  <span>{event.time}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="w-5 h-5" />
                  <span>{event.location}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-12">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Description */}
              <Card>
                <CardHeader>
                  <CardTitle>About This Event</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed text-lg">
                    {event.description}
                  </p>
                </CardContent>
              </Card>

              {/* Location */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <MapPin className="w-5 h-5" />
                    <span>Location</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="font-semibold">{event.location}</p>
                  </div>
                  <div className="mt-6 h-64 bg-muted rounded-lg flex items-center justify-center">
                    <p className="text-muted-foreground">Map Integration would go here</p>
                  </div>
                </CardContent>
              </Card>

              {/* Files */}
              {event.files && event.files.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Event Files</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {event.files.map((file, index) => (
                        <div key={index} className="flex items-center space-x-3 p-3 border rounded-lg">
                          <div className="flex-shrink-0">
                            {file.type.startsWith('image/') ? (
                              <img 
                                src={file.url} 
                                alt={`Event file ${index + 1}`}
                                className="w-12 h-12 object-cover rounded"
                              />
                            ) : (
                              <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                                <Tag className="w-6 h-6 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {file.url.split('/').pop()}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {file.type}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(file.url, '_blank')}
                          >
                            View
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Registration Card */}
              <Card className="sticky top-24">
                <CardHeader>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-foreground mb-2">
                      Free
                    </div>
                    <p className="text-muted-foreground">per person</p>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    onClick={handleRegister}
                    variant={isRegistered ? "outline" : "default"}
                    size="lg" 
                    className="w-full"
                  >
                    {isRegistered ? "Cancel Registration" : "Register Now"}
                  </Button>
                  
                  <div className="flex space-x-2">
                    <Button 
                      onClick={handleFavorite}
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                    >
                      <Heart className={`w-4 h-4 mr-2 ${isFavorited ? "fill-current" : ""}`} />
                      {isFavorited ? "Favorited" : "Favorite"}
                    </Button>
                    <Button 
                      onClick={handleShare}
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      Share
                    </Button>
                  </div>

                  <div className="border-t pt-4 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Date</span>
                      <span className="font-medium">{event.date}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Time</span>
                      <span className="font-medium">{event.time}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Location</span>
                      <span className="font-medium">{event.location}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Category</span>
                      <span className="font-medium capitalize">General</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default EventDetail;