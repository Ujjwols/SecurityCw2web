import { useState } from "react";
import { Filter, SortAsc } from "lucide-react";
import EventCard from "@/components/EventCard";
import SearchBar from "@/components/SearchBar";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { mockEvents } from "@/data/mockEvents";

const Events = () => {
  const [filteredEvents, setFilteredEvents] = useState(mockEvents);
  const [sortBy, setSortBy] = useState("date");

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

    setFilteredEvents(filtered);
  };

  const handleSort = (value: string) => {
    setSortBy(value);
    const sorted = [...filteredEvents].sort((a, b) => {
      switch (value) {
        case "date":
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case "price-low":
          const priceA = a.price === "Free" ? 0 : parseInt(a.price.replace("$", ""));
          const priceB = b.price === "Free" ? 0 : parseInt(b.price.replace("$", ""));
          return priceA - priceB;
        case "price-high":
          const priceA2 = a.price === "Free" ? 0 : parseInt(a.price.replace("$", ""));
          const priceB2 = b.price === "Free" ? 0 : parseInt(b.price.replace("$", ""));
          return priceB2 - priceA2;
        case "attendees":
          return b.attendees - a.attendees;
        default:
          return 0;
      }
    });
    setFilteredEvents(sorted);
  };

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

      {/* Search and Filters */}
      <section className="py-12 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SearchBar onSearch={handleSearch} />
          
          {/* Sort and Filter Options */}
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
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="attendees">Most Popular</SelectItem>
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
          ) : (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                <Filter className="w-12 h-12 text-muted-foreground" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-4">
                No events found
              </h3>
              <p className="text-muted-foreground mb-6">
                Try adjusting your search criteria to find more events
              </p>
              <Button onClick={() => handleSearch("", "", "")}>
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Events;