import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GalleryImage } from "@/data/mockGallery";
import { Camera, User, Calendar } from "lucide-react";

interface GalleryCardProps {
  image: GalleryImage;
}

const GalleryCard = ({ image }: GalleryCardProps) => {
  return (
    <Card className="group overflow-hidden bg-card border-border hover:border-primary/20 transition-all duration-300 hover:shadow-lg">
      <div className="aspect-square overflow-hidden">
        <img
          src={image.imageUrl}
          alt={image.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>
      <CardContent className="p-4">
        <div className="space-y-2">
          <div className="flex justify-between items-start">
            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
              {image.title}
            </h3>
            <Badge variant="secondary" className="ml-2 shrink-0">
              {image.category}
            </Badge>
          </div>
          
          <p className="text-sm text-muted-foreground line-clamp-2">
            {image.description}
          </p>
          
          <div className="flex flex-wrap gap-1">
            {image.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
          
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
            <div className="flex items-center gap-1">
              <User className="w-3 h-3" />
              <span>{image.photographer}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>{new Date(image.uploadDate).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GalleryCard;