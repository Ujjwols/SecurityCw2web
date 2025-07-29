import eventTech from "@/assets/event-tech.jpg";
import eventMusic from "@/assets/event-music.jpg";
import eventBusiness from "@/assets/event-business.jpg";
import eventWorkshop from "@/assets/event-workshop.jpg";

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  address: string;
  image: string;
  attendees: number;
  price: string;
  category: string;
  organizer: string;
  organizerEmail: string;
  tags: string[];
}

export const mockEvents: Event[] = [
  {
    id: "1",
    title: "React Summit 2024",
    description: "Join us for the biggest React conference of the year! Learn from industry experts, network with fellow developers, and discover the latest trends in React development. This event features workshops, keynote speakers, and hands-on coding sessions.",
    date: "March 15, 2024",
    time: "9:00 AM - 6:00 PM",
    location: "San Francisco Convention Center",
    address: "747 Howard St, San Francisco, CA 94103",
    image: eventTech,
    attendees: 1250,
    price: "$299",
    category: "technology",
    organizer: "Tech Events Inc.",
    organizerEmail: "contact@techevents.com",
    tags: ["React", "JavaScript", "Frontend", "Web Development"]
  },
  {
    id: "2",
    title: "Summer Music Festival",
    description: "Experience an unforgettable night of music under the stars! Featuring top artists from various genres including rock, pop, and electronic music. Food trucks, art installations, and a vibrant atmosphere await you.",
    date: "July 20, 2024",
    time: "6:00 PM - 12:00 AM",
    location: "Golden Gate Park",
    address: "Golden Gate Park, San Francisco, CA",
    image: eventMusic,
    attendees: 5000,
    price: "$89",
    category: "music",
    organizer: "SF Music Productions",
    organizerEmail: "info@sfmusic.com",
    tags: ["Music", "Festival", "Live Performance", "Outdoor"]
  },
  {
    id: "3",
    title: "Startup Networking Mixer",
    description: "Connect with fellow entrepreneurs, investors, and startup enthusiasts. This event provides the perfect opportunity to pitch your ideas, find potential co-founders, and learn from successful startup founders.",
    date: "April 8, 2024",
    time: "7:00 PM - 10:00 PM",
    location: "WeWork SOMA",
    address: "995 Market St, San Francisco, CA 94103",
    image: eventBusiness,
    attendees: 150,
    price: "Free",
    category: "business",
    organizer: "Startup Community SF",
    organizerEmail: "hello@startupsf.com",
    tags: ["Networking", "Startups", "Business", "Entrepreneurship"]
  },
  {
    id: "4",
    title: "Digital Marketing Workshop",
    description: "Learn the latest digital marketing strategies and tools in this hands-on workshop. Topics include SEO, social media marketing, content creation, and analytics. Perfect for business owners and marketing professionals.",
    date: "March 25, 2024",
    time: "10:00 AM - 4:00 PM",
    location: "The Learning Hub",
    address: "123 Market St, San Francisco, CA 94102",
    image: eventWorkshop,
    attendees: 50,
    price: "$149",
    category: "workshop",
    organizer: "Digital Growth Academy",
    organizerEmail: "workshops@digitalgrowth.com",
    tags: ["Marketing", "Digital", "Workshop", "SEO", "Social Media"]
  },
  {
    id: "5",
    title: "AI & Machine Learning Conference",
    description: "Explore the cutting-edge world of artificial intelligence and machine learning. Join researchers, engineers, and industry leaders for talks on the latest developments and practical applications of AI technology.",
    date: "May 12, 2024",
    time: "9:00 AM - 5:00 PM",
    location: "Moscone Center",
    address: "747 Howard St, San Francisco, CA 94103",
    image: eventTech,
    attendees: 800,
    price: "$399",
    category: "technology",
    organizer: "AI Innovation Forum",
    organizerEmail: "info@aiinnovation.org",
    tags: ["AI", "Machine Learning", "Technology", "Innovation"]
  },
  {
    id: "6",
    title: "Jazz & Wine Evening",
    description: "Enjoy an elegant evening of smooth jazz music paired with premium wines. Featuring local jazz artists and a curated selection of wines from Napa Valley. Perfect for a romantic date night or sophisticated social gathering.",
    date: "April 30, 2024",
    time: "7:30 PM - 11:00 PM",
    location: "The Wine Cellar",
    address: "456 Union St, San Francisco, CA 94133",
    image: eventMusic,
    attendees: 120,
    price: "$75",
    category: "music",
    organizer: "Jazz & Wine Society",
    organizerEmail: "events@jazzwine.com",
    tags: ["Jazz", "Wine", "Music", "Fine Dining"]
  }
];