export interface GalleryImage {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  category: string;
  photographer: string;
  uploadDate: string;
  tags: string[];
}

export const mockGalleryImages: GalleryImage[] = [
  {
    id: "1",
    title: "Modern Workspace",
    description: "A sleek and modern workspace setup with natural lighting",
    imageUrl: "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b",
    category: "workspace",
    photographer: "Alex Johnson",
    uploadDate: "2024-01-15",
    tags: ["workspace", "modern", "productivity"]
  },
  {
    id: "2",
    title: "Java Programming",
    description: "Code editor showing Java programming in action",
    imageUrl: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6",
    category: "technology",
    photographer: "Sarah Tech",
    uploadDate: "2024-01-20",
    tags: ["programming", "java", "coding"]
  },
  {
    id: "3",
    title: "Colorful Code",
    description: "Vibrant web development code displayed on monitor",
    imageUrl: "https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7",
    category: "technology",
    photographer: "Dev Master",
    uploadDate: "2024-01-25",
    tags: ["web development", "colorful", "monitor"]
  },
  {
    id: "4",
    title: "Ocean Waves",
    description: "Beautiful ocean waves crashing on the beach",
    imageUrl: "https://images.unsplash.com/photo-1500375592092-40eb2021de21",
    category: "nature",
    photographer: "Ocean Explorer",
    uploadDate: "2024-02-01",
    tags: ["ocean", "waves", "beach"]
  },
  {
    id: "5",
    title: "Mountain Sunrise",
    description: "Majestic mountain landscape illuminated by sunrise",
    imageUrl: "https://images.unsplash.com/photo-1469474968028-56623f02e42e",
    category: "nature",
    photographer: "Mountain Hiker",
    uploadDate: "2024-02-05",
    tags: ["mountain", "sunrise", "landscape"]
  },
  {
    id: "6",
    title: "Golden Forest",
    description: "Yellow lights filtering through forest trees",
    imageUrl: "https://images.unsplash.com/photo-1500673922987-e212871c2c22",
    category: "nature",
    photographer: "Forest Walker",
    uploadDate: "2024-02-10",
    tags: ["forest", "lights", "golden"]
  },
  {
    id: "7",
    title: "Glass Architecture",
    description: "Modern glass building shot from below",
    imageUrl: "https://images.unsplash.com/photo-1496307653780-48ee777d4833",
    category: "architecture",
    photographer: "City Photographer",
    uploadDate: "2024-02-15",
    tags: ["architecture", "glass", "modern"]
  },
  {
    id: "8",
    title: "Cozy Cat",
    description: "Orange tabby cat resting on beautiful textile",
    imageUrl: "https://images.unsplash.com/photo-1582562120811-c09040d0a901",
    category: "animals",
    photographer: "Pet Lover",
    uploadDate: "2024-02-20",
    tags: ["cat", "tabby", "cozy"]
  },
  {
    id: "9",
    title: "Playful Monkey",
    description: "Monkey holding banana during bright daylight",
    imageUrl: "https://images.unsplash.com/photo-1501286353178-1ec881214838",
    category: "animals",
    photographer: "Wildlife Expert",
    uploadDate: "2024-02-25",
    tags: ["monkey", "banana", "playful"]
  },
  {
    id: "10",
    title: "Ranch Horses",
    description: "Four beautiful brown horses behind wooden fence",
    imageUrl: "https://images.unsplash.com/photo-1452378174528-3090a4bba7b2",
    category: "animals",
    photographer: "Ranch Owner",
    uploadDate: "2024-03-01",
    tags: ["horses", "ranch", "brown"]
  }
];