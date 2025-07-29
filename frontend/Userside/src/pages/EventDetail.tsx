import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Calendar, MapPin, Users, Clock, Tag, Mail, ArrowLeft, Share2, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { mockEvents } from "@/data/mockEvents";
import { useToast } from "@/hooks/use-toast";

const EventDetail = () => {
  const { id } = useParams();
  const { toast } = useToast();
  const [isRegistered, setIsRegistered] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  
  const event = mockEvents.find(e => e.id === id);

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

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative">
        <div className="h-96 overflow-hidden">
          <img
            src={event.image}
            alt={event.title}
            className="w-full h-full object-cover"
          />
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
                  {event.category}
                </Badge>
                {event.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="border-white text-white">
                    {tag}
                  </Badge>
                ))}
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
                <div className="flex items-center space-x-2">
                  <Users className="w-5 h-5" />
                  <span>{event.attendees} attending</span>
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
                    <p className="text-muted-foreground">{event.address}</p>
                  </div>
                  <div className="mt-6 h-64 bg-muted rounded-lg flex items-center justify-center">
                    <p className="text-muted-foreground">Map Integration would go here</p>
                  </div>
                </CardContent>
              </Card>

              {/* Organizer */}
              <Card>
                <CardHeader>
                  <CardTitle>Event Organizer</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-lg">
                        {event.organizer.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold">{event.organizer}</p>
                      <p className="text-muted-foreground flex items-center space-x-1">
                        <Mail className="w-4 h-4" />
                        <span>{event.organizerEmail}</span>
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Registration Card */}
              <Card className="sticky top-24">
                <CardHeader>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-foreground mb-2">
                      {event.price}
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
                      <span className="text-muted-foreground">Attendees</span>
                      <span className="font-medium">{event.attendees} people</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Category</span>
                      <span className="font-medium capitalize">{event.category}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tags */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Tag className="w-5 h-5" />
                    <span>Tags</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {event.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
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