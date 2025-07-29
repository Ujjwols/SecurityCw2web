import { useState } from "react";
import SearchBar from "@/components/SearchBar";
import GalleryCard from "@/components/GalleryCard";
import { mockGalleryImages } from "@/data/mockGallery";

const Gallery = () => {
  const [filteredImages, setFilteredImages] = useState(mockGalleryImages);

  const handleSearch = (query: string, location: string, category: string) => {
    let filtered = mockGalleryImages;

    if (query) {
      filtered = filtered.filter(image =>
        image.title.toLowerCase().includes(query.toLowerCase()) ||
        image.description.toLowerCase().includes(query.toLowerCase()) ||
        image.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
      );
    }

    if (category && category !== "all") {
      filtered = filtered.filter(image => image.category === category);
    }

    // For gallery, we can use location to filter by photographer
    if (location) {
      filtered = filtered.filter(image =>
        image.photographer.toLowerCase().includes(location.toLowerCase())
      );
    }

    setFilteredImages(filtered);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-6">
            Photo Gallery
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Discover stunning photography from our community of talented photographers
          </p>
        </div>
      </section>

      {/* Search Section */}
      <section className="py-8 bg-card border-b">
        <div className="container mx-auto px-4">
          <SearchBar 
            onSearch={handleSearch}
            searchPlaceholder="Search photos..."
            locationPlaceholder="Photographer..."
            categories={[
              { value: "all", label: "All Categories" },
              { value: "technology", label: "Technology" },
              { value: "nature", label: "Nature" },
              { value: "architecture", label: "Architecture" },
              { value: "animals", label: "Animals" },
              { value: "workspace", label: "Workspace" }
            ]}
          />
        </div>
      </section>

      {/* Gallery Grid */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredImages.map((image) => (
              <GalleryCard key={image.id} image={image} />
            ))}
          </div>
          
          {filteredImages.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">No images found matching your search criteria.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Gallery;