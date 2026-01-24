// Paywall types for generic-to-specific reveal system

export interface ActivityOption {
  name: string;
  description: string;
  price: number;
  isBestValue?: boolean;
}

export interface GenericActivity {
  id: string;
  time: string;
  endTime?: string;
  category: 'flight' | 'hotel' | 'restaurant' | 'attraction' | 'museum' | 'tour' | 'transport' | 'shopping' | 'nightlife' | 'free-time' | 'beach' | 'nature';
  genericTitle: string;
  genericDescription: string;
  estimatedCost: number;
  duration?: string;
  tips: string[];
  isFree: boolean;
  
  // Revealed after payment:
  specificName?: string;
  address?: string;
  phone?: string;
  bookingUrl?: string;
  googleMapsUrl?: string;
  options?: ActivityOption[];
  coordinates?: { lat: number; lng: number };
}

export interface PaywallDayItinerary {
  id: string;
  dayNumber: number;
  date: string;
  totalSpent: number;
  activities: GenericActivity[];
  isLocked: boolean;
  weather?: {
    temp: number;
    condition: string;
    icon: string;
  };
  proTips?: string[];
}

export interface PaywallTripDetails {
  destination: string;
  country: string;
  days: number;
  totalCost: number;
  travelers: number;
}
