import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SearchBarProps {
  onSearch: (query: string) => void;
  searchPlaceholder?: string;
}

const SearchBar = ({
  onSearch,
  searchPlaceholder = "Search events by title or description...",
}: SearchBarProps) => {
  const [query, setQuery] = useState("");

const handleSearch = () => {
    console.log("Search button clicked, query:", query); // Debug log
    onSearch(query.trim());
  };

  return (
    <div className="bg-background/90 backdrop-blur-md border border-border rounded-2xl p-4 sm:p-6 shadow-md transition-all">
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
        {/* Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
          <Input
            placeholder={searchPlaceholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="pl-10 pr-4 py-2 h-12 rounded-xl focus:ring-2 focus:ring-primary transition-all"
          />
        </div>

        {/* Button */}
        <Button
          onClick={handleSearch}
          size="lg"
          className="h-12 px-6 rounded-xl flex items-center justify-center gap-2 transition-all"
        >
          <Search className="w-5 h-5" />
          <span>Search</span>
        </Button>
      </div>
    </div>
  );
};

export default SearchBar;
