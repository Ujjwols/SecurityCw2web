import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Calendar, Users, MapPin, Star } from "lucide-react";
import EventCard from "@/components/EventCard";
import SearchBar from "@/components/SearchBar";
import { mockEvents } from "@/data/mockEvents";

const Home = () => {
  const [filteredEvents, setFilteredEvents] = useState(mockEvents.slice(0, 6));

  const handleSearch = (query: string, location: string, category: string) => {
    let filtered = mockEvents;

    if (query) {
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(query.toLowerCase()) ||
        event.description.toLowerCase().includes(query.toLowerCase()) ||
        event.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
      );
    }

    if (location) {
      filtered = filtered.filter(event =>
        event.location.toLowerCase().includes(location.toLowerCase()) ||
        event.address.toLowerCase().includes(location.toLowerCase())
      );
    }

    if (category && category !== "all") {
      filtered = filtered.filter(event => event.category === category);
    }

    setFilteredEvents(filtered.slice(0, 6));
  };

  const featuredEvent = mockEvents[0];

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
                <Button size="lg" variant="outline" className="text-lg px-8 py-4 border-white text-white hover:bg-white hover:text-primary">
                  Create Account
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Search Section */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Find Your Perfect Event
            </h2>
            <p className="text-xl text-muted-foreground">
              Search through thousands of events by keyword, location, or category
            </p>
          </div>
          <SearchBar onSearch={handleSearch} />
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
          
          <div className="bg-gradient-card rounded-3xl overflow-hidden shadow-xl border">
            <div className="grid lg:grid-cols-2 gap-0">
              <div className="relative h-64 lg:h-full">
                <img
                  src={featuredEvent.image}
                  alt={featuredEvent.title}
                  className="w-full h-full object-cover"
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
                    <span>{featuredEvent.date} at {featuredEvent.time}</span>
                  </div>
                  <div className="flex items-center space-x-3 text-muted-foreground">
                    <MapPin className="w-5 h-5 text-primary" />
                    <span>{featuredEvent.location}</span>
                  </div>
                  <div className="flex items-center space-x-3 text-muted-foreground">
                    <Users className="w-5 h-5 text-primary" />
                    <span>{featuredEvent.attendees} attending</span>
                  </div>
                </div>
                <Link to={`/event/${featuredEvent.id}`}>
                  <Button size="lg" className="w-full lg:w-auto">
                    View Details & Register
                  </Button>
                </Link>
              </div>
            </div>
          </div>
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
            {filteredEvents.map((event) => (
              <EventCard
                key={event.id}
                id={event.id}
                title={event.title}
                date={event.date}
                time={event.time}
                location={event.location}
                image={event.image}
                attendees={event.attendees}
                price={event.price}
                category={event.category}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { number: "10K+", label: "Active Users", icon: Users },
              { number: "500+", label: "Events This Month", icon: Calendar },
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