import { useState } from "react";
import { Search, MapPin, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface SearchBarProps {
  onSearch: (query: string, location: string, category: string) => void;
  searchPlaceholder?: string;
  locationPlaceholder?: string;
  categories?: Array<{ value: string; label: string }>;
}

const SearchBar = ({ 
  onSearch, 
  searchPlaceholder = "Search events...", 
  locationPlaceholder = "Location...",
  categories = [
    { value: "all", label: "All Categories" },
    { value: "technology", label: "Technology" },
    { value: "music", label: "Music" },
    { value: "business", label: "Business" },
    { value: "workshop", label: "Workshop" }
  ]
}: SearchBarProps) => {
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("all");

  const handleSearch = () => {
    onSearch(query, location, category);
  };

  return (
    <div className="bg-background/95 backdrop-blur-sm border border-border rounded-2xl p-6 shadow-lg">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Search Query */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder={searchPlaceholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10"
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>

        {/* Location */}
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder={locationPlaceholder}
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="pl-10"
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>

        {/* Category */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 z-10" />
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="pl-10">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Search Button */}
        <Button onClick={handleSearch} size="lg" className="w-full">
          <Search className="w-4 h-4 mr-2" />
          Search
        </Button>
      </div>
    </div>
  );
};

export default SearchBar;