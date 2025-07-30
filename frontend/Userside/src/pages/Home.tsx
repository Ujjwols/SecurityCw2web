import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Calendar, Users, MapPin, Star } from "lucide-react";
import EventCard from "@/components/EventCard";
import SearchBar from "@/components/SearchBar";
import api from "@/api/api";
import { useToast } from "@/hooks/use-toast";
import { AxiosError } from "axios";
import { format } from "date-fns";

interface Event {
  _id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  files: { url: string; type: string }[];
}

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

const Home = () => {
  const { toast } = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [featuredEvent, setFeaturedEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await api.get<EventApiResponse>("/event/get-all-event");
      console.log("Events Response:", response.data);

      if (response.data.success) {
        const eventsData = Array.isArray(response.data.data.events)
          ? response.data.data.events
          : [];
        setEvents(eventsData);
        setFilteredEvents(eventsData.slice(0, 6));
        // Set featured event (e.g., most recent event)
        setFeaturedEvent(eventsData[0] || null);
      } else {
        throw new Error("Failed to fetch events");
      }
    } catch (error: unknown) {
      console.error("Fetch Events Error:", error);
      const errorMessage = error instanceof AxiosError
        ? error.response?.status === 401
          ? "Please log in to view events."
          : error.response?.data?.message || "Failed to fetch events"
        : "An unexpected error occurred";
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-hero">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="text-center text-white">
            <h1 className="text-4xl lg:text-6xl font-bold mb-6 leading-tight">
              Discover Amazing
              <br />
              <span className="text-accent">Events Near You</span>
            </h1>
            <p className="text-xl lg:text-2xl text-white/90 mb-8 max-w-3xl mx-auto">
              Connect with your community through incredible experiences. 
              From tech conferences to music festivals, find your next adventure.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/events">
                <Button size="lg" variant="accent" className="text-lg px-8 py-4">
                  Explore Events
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link to="/register">
                <Button size="lg" variant="outline" className="text-lg px-8 py-4 border-white text-black hover:bg-white hover:text-primary">
                  Create Account
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Event */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Featured Event
            </h2>
            <p className="text-xl text-muted-foreground">
              Don't miss out on this amazing upcoming event
            </p>
          </div>
          
          {featuredEvent && (
            <div className="bg-gradient-card rounded-3xl overflow-hidden shadow-xl border">
              <div className="grid lg:grid-cols-2 gap-0">
                <div className="relative h-64 lg:h-full">
                  <img
                    src={featuredEvent.files?.find(file => file.type.startsWith("image/"))?.url || "/fallback-image.png"}
                    alt={featuredEvent.title}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.currentTarget.src = "/fallback-image.png"; }}
                  />
                  <div className="absolute top-6 left-6">
                    <span className="bg-accent text-accent-foreground px-4 py-2 rounded-full text-sm font-bold">
                      Featured
                    </span>
                  </div>
                </div>
                <div className="p-8 lg:p-12 flex flex-col justify-center">
                  <h3 className="text-2xl lg:text-3xl font-bold text-foreground mb-4">
                    {featuredEvent.title}
                  </h3>
                  <p className="text-muted-foreground mb-6 text-lg">
                    {featuredEvent.description.substring(0, 200)}...
                  </p>
                  <div className="space-y-3 mb-8">
                    <div className="flex items-center space-x-3 text-muted-foreground">
                      <Calendar className="w-5 h-5 text-primary" />
                      <span>
                        {format(new Date(`${featuredEvent.date}T${featuredEvent.time}:00+05:45`), "MMMM d, yyyy 'at' h:mm a")}
                      </span>
                    </div>
                    <div className="flex items-center space-x-3 text-muted-foreground">
                      <MapPin className="w-5 h-5 text-primary" />
                      <span>{featuredEvent.location}</span>
                    </div>
                  </div>
                  <Link to={`/event/${featuredEvent._id}`}>
                    <Button size="lg" className="w-full lg:w-auto">
                      View Details
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Upcoming Events */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-12">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
                Upcoming Events
              </h2>
              <p className="text-xl text-muted-foreground">
                Discover what's happening in your area
              </p>
            </div>
            <Link to="/events">
              <Button variant="outline" size="lg">
                View All Events
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredEvents.length > 0 ? (
              filteredEvents.map((event) => (
                <EventCard
                  key={event._id}
                  id={event._id}
                  title={event.title}
                  date={event.date}
                  time={event.time}
                  location={event.location}
                  image={event.files?.find(file => file.type.startsWith("image/"))?.url || "/fallback-image.png"} // Update if category field is added to backend
                />
              ))
            ) : (
              <p className="text-center text-muted-foreground col-span-3">
                No events found matching your criteria.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { number: "10K+", label: "Active Users", icon: Users },
              { number: events.length.toString(), label: "Events This Month", icon: Calendar },
              { number: "50+", label: "Cities", icon: MapPin },
              { number: "4.9", label: "Average Rating", icon: Star },
            ].map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="text-center">
                  <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-3xl lg:text-4xl font-bold text-foreground mb-2">
                    {stat.number}
                  </div>
                  <div className="text-muted-foreground text-lg">
                    {stat.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;