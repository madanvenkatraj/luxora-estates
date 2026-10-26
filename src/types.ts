/** Shared domain types for LUXORA ESTATES — the single contract every
 * component, page and future API consumer works against. */

export type ListingIntent = "buy" | "rent";

export type PropertyType =
  | "apartment"
  | "house"
  | "villa"
  | "studio"
  | "plot"
  | "commercial"
  | "office";

export type Furnishing = "furnished" | "semi-furnished" | "unfurnished";

export type ListingStatus = "featured" | "new" | "reduced" | "standard";

export type City = "Bengaluru" | "Mumbai" | "Pune" | "Hyderabad" | "Chennai";

export interface PropertyLocation {
  city: City;
  locality: string;
  address: string;
}

export interface NearbyPlace {
  category: "school" | "hospital" | "shopping" | "transport";
  name: string;
  distanceKm: number;
}

export interface Property {
  /** Stable id, e.g. "lx-001" — safe for localStorage and URLs. */
  id: string;
  /** URL slug for /property/:slug routes. */
  slug: string;
  referenceId: string;
  title: string;
  type: PropertyType;
  intent: ListingIntent;
  /** Monthly rent when intent is "rent", asking price when "buy" (INR). */
  price: number;
  status: ListingStatus;
  bedrooms: number;
  bathrooms: number;
  areaSqft: number;
  furnishing: Furnishing;
  amenities: string[];
  description: string;
  location: PropertyLocation;
  /** Rough demo coordinates used only by the map placeholder. */
  coordinates: { lat: number; lng: number };
  yearBuilt: number;
  /** Property age in years (0 = new construction). */
  ageYears: number;
  parking: number;
  facing: string;
  floor: string;
  listedAt: string; // ISO date
  images: string[];
  agentId: string;
  nearby: NearbyPlace[];
}

export interface Agent {
  id: string;
  name: string;
  title: string;
  specialty: string;
  bio: string;
  phone: string;
  email: string;
  experienceYears: number;
  languages: string[];
  listingsCount: number;
  photo: string;
}

export type NeighborhoodCategory = "family" | "business" | "premium" | "emerging";

export interface Neighborhood {
  id: string;
  name: string;
  city: City;
  category: NeighborhoodCategory;
  description: string;
  image: string;
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  rating: number;
  quote: string;
  initials: string;
}

export interface GuideArticle {
  id: string;
  title: string;
  excerpt: string;
  readTimeMinutes: number;
  category: string;
  image: string;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export type SortKey =
  | "relevance"
  | "price-asc"
  | "price-desc"
  | "newest"
  | "area-desc";

export interface PropertyFilters {
  intent: ListingIntent | "any";
  location: string;
  type: PropertyType | "any";
  minPrice: number | null;
  maxPrice: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  minArea: number | null;
  furnishing: Furnishing | "any";
  amenities: string[];
  sort: SortKey;
}

export const EMPTY_FILTERS: PropertyFilters = {
  intent: "any",
  location: "",
  type: "any",
  minPrice: null,
  maxPrice: null,
  bedrooms: null,
  bathrooms: null,
  minArea: null,
  furnishing: "any",
  amenities: [],
  sort: "relevance",
};

/** The eight discovery categories with their filter mapping. */
export interface Category {
  id: string;
  label: string;
  description: string;
  image: string;
  type: PropertyType | "any";
  intent: ListingIntent | "any";
}

export const ALL_AMENITIES: string[] = [
  "Swimming Pool",
  "Gym",
  "Clubhouse",
  "Security",
  "Power Backup",
  "Covered Parking",
  "Garden",
  "Elevator",
  "Pet Friendly",
  "Modular Kitchen",
  "Balcony",
  "Smart Home",
];

export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  apartment: "Luxury Apartment",
  house: "Independent House",
  villa: "Premium Villa",
  studio: "Studio Apartment",
  plot: "Residential Plot",
  commercial: "Commercial Property",
  office: "Office Space",
};

export const FURNISHING_LABELS: Record<Furnishing, string> = {
  furnished: "Furnished",
  "semi-furnished": "Semi-Furnished",
  unfurnished: "Unfurnished",
};

export const AMENITY_ICONS: Record<string, string> = {
  "Swimming Pool": "🏊",
  Gym: "🏋️",
  Clubhouse: "🏛️",
  Security: "🛡️",
  "Power Backup": "🔌",
  "Covered Parking": "🚗",
  Garden: "🌿",
  Elevator: "🛗",
  "Pet Friendly": "🐾",
  "Modular Kitchen": "🍳",
  Balcony: "🪟",
  "Smart Home": "📱",
};
