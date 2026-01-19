export interface TravelSearch {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate: string;
  budget: number;
  travelers: number;
}

export interface Flight {
  id: string;
  airline: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  stops: number;
  price: number;
  departure: {
    airport: string;
    city: string;
  };
  arrival: {
    airport: string;
    city: string;
  };
}

export interface Hotel {
  id: string;
  name: string;
  rating: number;
  reviewCount: number;
  pricePerNight: number;
  totalPrice: number;
  amenities: string[];
  image: string;
  location: string;
}

export interface SelectedItems {
  outboundFlight: Flight | null;
  returnFlight: Flight | null;
  hotel: Hotel | null;
}

export interface Itinerary {
  search: TravelSearch;
  selections: SelectedItems;
  totalCost: number;
}
