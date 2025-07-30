import { Calendar, MapPin, Users, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Link } from "react-router-dom";

interface EventCardProps {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  image: string;
}

const EventCard = ({ 
  id, 
  title, 
  date, 
  time, 
  location, 
  image
}: EventCardProps) => {
  return (
    <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 bg-gradient-card border-0">
      <CardHeader className="p-0">
        <div className="relative overflow-hidden">
          <img
            src={image}
            alt={title}
            className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-110"
          />
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        <h3 className="text-xl font-bold text-foreground mb-3 line-clamp-2 group-hover:text-primary transition-colors">
          {title}
        </h3>
        
        <div className="space-y-2 text-muted-foreground">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-primary" />
            <span className="text-sm">{date}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-primary" />
            <span className="text-sm">{time}</span>
          </div>
          <div className="flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-primary" />
            <span className="text-sm">{location}</span>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="p-6 pt-0">
        <Link to={`/event/${id}`} className="w-full">
          <Button className="w-full">View Details</Button>
        </Link>
      </CardFooter>
    </Card>
  );
};

export default EventCard;