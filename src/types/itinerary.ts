// Itinerary types for day-by-day planning

export type ActivityType = 
  | 'flight' 
  | 'hotel' 
  | 'restaurant' 
  | 'attraction' 
  | 'museum' 
  | 'tour' 
  | 'transport' 
  | 'shopping' 
  | 'nightlife' 
  | 'free-time'
  | 'beach'
  | 'nature';

export interface ActivityLocation {
  name: string;
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  googleMapsUrl?: string;
}

export interface Activity {
  id: string;
  time: string; // e.g., "09:00"
  endTime?: string; // e.g., "11:00"
  type: ActivityType;
  name: string;
  description: string;
  cost: number;
  duration: string; // e.g., "2h", "45min"
  location: ActivityLocation;
  bookingUrl?: string;
  tips?: string[];
  isFree: boolean;
  isBooked?: boolean;
}

export interface DayWeather {
  temp: number;
  condition: 'sunny' | 'partly-cloudy' | 'rainy' | 'cold' | 'hot';
  icon: string;
}

export interface DayPlan {
  id: string;
  dayNumber: number;
  date: Date;
  weather: DayWeather;
  activities: Activity[];
  dailyBudget: number;
  proTips: string[];
}

export interface ItineraryState {
  days: DayPlan[];
  totalBudget: number;
  totalSpent: number;
  destination: {
    name: string;
    country: string;
    imageUrl: string;
    coordinates: { lat: number; lng: number };
  };
  tripDates: {
    start: Date;
    end: Date;
  };
  travelers: number;
}

export interface BudgetByCategory {
  flights: number;
  accommodation: number;
  activities: number;
  food: number;
  transportation: number;
}
