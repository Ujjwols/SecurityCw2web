import { useState, useEffect } from "react";
import { SortAsc, Loader2, Calendar } from "lucide-react";
import EventCard from "@/components/EventCard";
import SearchBar from "@/components/SearchBar";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import api, { initializeAPI } from "@/api/api";
import { AxiosError } from "axios";
import { format } from "date-fns";

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

const Events = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("date");
  const { toast } = useToast();

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        await initializeAPI();
        const response = await api.get<EventApiResponse>("/event/get-all-event");
        console.log("Events Response:", response.data);
        if (response.data.success) {
          const eventsData = Array.isArray(response.data.data.events)
            ? response.data.data.events
            : [];
          setEvents(eventsData);
          setFilteredEvents(eventsData);
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
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [toast]);

    const handleSearch = (query: string) => {
    let filtered = events;

    if (query) {
      filtered = filtered.filter((event) =>
        event.title.toLowerCase().includes(query.toLowerCase()) ||
        event.description.toLowerCase().includes(query.toLowerCase())
      );
    }

    setFilteredEvents(filtered);
  };

  const handleSort = (value: string) => {
    setSortBy(value);
    const sorted = [...filteredEvents].sort((a, b) => {
      switch (value) {
        case "date":
          return new Date(`${a.date}T${a.time}:00+05:45`).getTime() - new Date(`${b.date}T${b.time}:00+05:45`).getTime();
        case "title":
          return a.title.localeCompare(b.title);
        case "location":
          return a.location.localeCompare(b.location);
        case "newest":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        default:
          return 0;
      }
    });
    setFilteredEvents(sorted);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="bg-gradient-primary py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-white">
            <h1 className="text-4xl lg:text-5xl font-bold mb-4">
              All Events
            </h1>
            <p className="text-xl text-white/90 max-w-2xl mx-auto">
              Discover amazing events happening in your area and beyond
            </p>
          </div>
        </div>
      </section>

      {/* Search and Sort Options */}
      <section className="py-12 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SearchBar onSearch={handleSearch} />
          
          {/* Sort Options */}
          <div className="flex flex-col sm:flex-row justify-between items-center mt-8 gap-4">
            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground">
                Showing {filteredEvents.length} events
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <SortAsc className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Sort by:</span>
              </div>
              <Select value={sortBy} onValueChange={handleSort}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="title">Title</SelectItem>
                  <SelectItem value="location">Location</SelectItem>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </section>

      {/* Events Grid */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {filteredEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredEvents.map((event) => (
                <EventCard
                  key={event._id}
                  id={event._id}
                  title={event.title}
                  date={event.date}
                  time={event.time}
                  location={event.location}
                  image={event.files?.find(file => file.type.startsWith("image/"))?.url || "/fallback-image.png"}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                <Calendar className="w-12 h-12 text-muted-foreground" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-4">
                No events found
              </h3>
              <p className="text-muted-foreground mb-6">
                Try adjusting your search to find more events
              </p>
              <Button onClick={() => handleSearch("")}>
                Clear Search
              </Button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Events;