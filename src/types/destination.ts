export interface HotelOption {
  tier: '3-star' | '4-star' | '5-star';
  name: string;
  pricePerNight: number;
  rating: number;
  amenities: string[];
  neighborhood: string;
}

export interface CostBreakdown {
  flightCost: number;
  hotelPerNight: number;
  activitiesPerDay: number;
  foodPerDay: number;
  transportPerDay: number;
}

export interface Destination {
  id: string;
  name: string;
  country: string;
  region: 'Europe' | 'Asia' | 'North America' | 'South America' | 'Africa' | 'Oceania' | 'Middle East' | 'Caribbean';
  imageUrl: string;
  
  // Cost estimates (per person, per day in USD)
  costs: {
    budget: number;      // Hostel/budget hotel + street food
    mid: number;         // 3-star hotel + casual dining
    luxury: number;      // 4-5 star hotel + fine dining
    flight: number;      // Average round-trip from major US city
  };
  
  // Monthly weather data (1-12)
  weather: {
    [month: number]: {
      temp: number;          // Average high in Fahrenheit
      rainfall: number;      // Inches
      condition: 'sunny' | 'partly-cloudy' | 'rainy' | 'cold' | 'hot';
      crowdLevel: 1 | 2 | 3 | 4 | 5;  // 1 = empty, 5 = packed
    };
  };
  
  // Value factors
  highlights: string[];
  tags: string[];
  bestFor: string[];
  
  // Coordinates for map
  coordinates: {
    lat: number;
    lng: number;
  };
  
  // Extended data (optional)
  pros?: string[];
  cons?: string[];
  hotelOptions?: HotelOption[];
  detailedCosts?: CostBreakdown;
}

export interface DestinationMatch extends Destination {
  // Calculated based on user budget & dates
  valueScore: number;          // 0-100
  estimatedTotalCost: number;  // For trip duration
  dailyCost: number;           // Based on style
  flightCost: number;
  accommodationCost: number;   // Total hotel cost
  activitiesCost: number;      // Estimated activities
  foodCost: number;            // Estimated food
  weatherScore: number;        // 0-100 based on travel dates
  crowdScore: number;          // 0-100 (higher = less crowded)
  confidenceScore: number;     // 0-100 overall confidence
  affordability: 'budget-friendly' | 'good-value' | 'splurge' | 'over-budget';
  budgetDelta: number;         // Positive = under budget, negative = over
  whyThisWorks: string;        // AI-generated insight
  flagEmoji: string;           // Country flag emoji
  
  // Extended match data
  pros?: string[];
  cons?: string[];
}

export interface CompareDestination {
  destination: DestinationMatch;
  selected: boolean;
}
