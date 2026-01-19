import { Flight, Hotel } from '@/types/travel';
import { mockFlights, mockReturnFlights, mockHotels } from '@/data/mockData';

// API Response Types
export interface SerpApiFlightResponse {
  best_flights?: SerpApiFlight[];
  other_flights?: SerpApiFlight[];
  error?: string;
}

export interface SerpApiFlight {
  flights: {
    departure_airport: { name: string; id: string };
    arrival_airport: { name: string; id: string };
    departure_time: string;
    arrival_time: string;
    duration: number;
    airline: string;
    airline_logo: string;
  }[];
  total_duration: number;
  price: number;
  layovers?: { name: string; duration: number }[];
}

export interface AmadeusHotelResponse {
  data?: AmadeusHotel[];
  errors?: { detail: string }[];
}

export interface AmadeusHotel {
  hotel: {
    hotelId: string;
    name: string;
    rating: string;
    address: { cityName: string };
    media?: { uri: string }[];
    amenities?: string[];
  };
  offers: {
    price: { total: string };
    room: { description: { text: string } };
  }[];
}

// Helper to format duration from minutes
const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
};

// Generate unique ID
const generateId = (): string => Math.random().toString(36).substring(2, 9);

/**
 * Search for flights using SerpAPI Google Flights
 * Falls back to mock data in development or on error
 */
export async function searchFlights(
  origin: string,
  destination: string,
  departDate: string,
  returnDate: string,
  type: 'outbound' | 'return' = 'outbound'
): Promise<Flight[]> {
  const apiKey = import.meta.env.VITE_SERPAPI_KEY;
  
  // Use mock data if no API key is configured
  if (!apiKey) {
    console.info('SerpAPI key not configured, using mock flight data');
    return type === 'outbound' ? mockFlights : mockReturnFlights;
  }

  try {
    const params = new URLSearchParams({
      engine: 'google_flights',
      api_key: apiKey,
      departure_id: origin,
      arrival_id: destination,
      outbound_date: type === 'outbound' ? departDate : returnDate,
      currency: 'USD',
      hl: 'en',
      type: '1', // Round trip
    });

    const response = await fetch(`https://serpapi.com/search.json?${params}`);
    
    if (!response.ok) {
      throw new Error(`SerpAPI error: ${response.status}`);
    }

    const data: SerpApiFlightResponse = await response.json();

    if (data.error) {
      throw new Error(data.error);
    }

    const allFlights = [...(data.best_flights || []), ...(data.other_flights || [])];

    return allFlights.map((flight): Flight => {
      const firstLeg = flight.flights[0];
      const lastLeg = flight.flights[flight.flights.length - 1];
      const stops = flight.flights.length - 1;

      return {
        id: generateId(),
        airline: firstLeg.airline,
        departureTime: firstLeg.departure_time,
        arrivalTime: lastLeg.arrival_time,
        duration: formatDuration(flight.total_duration),
        stops,
        price: flight.price,
        departure: {
          airport: firstLeg.departure_airport.id,
          city: firstLeg.departure_airport.name,
        },
        arrival: {
          airport: lastLeg.arrival_airport.id,
          city: lastLeg.arrival_airport.name,
        },
      };
    });
  } catch (error) {
    console.error('Error fetching flights:', error);
    // Fallback to mock data on error
    return type === 'outbound' ? mockFlights : mockReturnFlights;
  }
}

/**
 * Search for hotels using Amadeus Hotel Search API
 * Falls back to mock data in development or on error
 */
export async function searchHotels(
  destination: string,
  checkIn: string,
  checkOut: string,
  adults: number = 1
): Promise<Hotel[]> {
  const apiKey = import.meta.env.VITE_AMADEUS_KEY;
  const apiSecret = import.meta.env.VITE_AMADEUS_SECRET;

  // Use mock data if no API key is configured
  if (!apiKey || !apiSecret) {
    console.info('Amadeus API keys not configured, using mock hotel data');
    return calculateHotelTotals(mockHotels, checkIn, checkOut);
  }

  try {
    // First, get an access token
    const tokenResponse = await fetch('https://api.amadeus.com/v1/security/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: apiKey,
        client_secret: apiSecret,
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error(`Amadeus auth error: ${tokenResponse.status}`);
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Search for hotels by city
    const cityResponse = await fetch(
      `https://api.amadeus.com/v1/reference-data/locations/hotels/by-city?cityCode=${destination}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!cityResponse.ok) {
      throw new Error(`Amadeus hotel search error: ${cityResponse.status}`);
    }

    const cityData = await cityResponse.json();
    const hotelIds = cityData.data?.slice(0, 10).map((h: { hotelId: string }) => h.hotelId) || [];

    if (hotelIds.length === 0) {
      return calculateHotelTotals(mockHotels, checkIn, checkOut);
    }

    // Get hotel offers
    const offersResponse = await fetch(
      `https://api.amadeus.com/v3/shopping/hotel-offers?hotelIds=${hotelIds.join(',')}&checkInDate=${checkIn}&checkOutDate=${checkOut}&adults=${adults}&currency=USD`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!offersResponse.ok) {
      throw new Error(`Amadeus offers error: ${offersResponse.status}`);
    }

    const offersData: AmadeusHotelResponse = await offersResponse.json();

    if (offersData.errors || !offersData.data) {
      throw new Error(offersData.errors?.[0]?.detail || 'No hotel offers found');
    }

    const nights = calculateNights(checkIn, checkOut);

    return offersData.data.map((hotel): Hotel => {
      const priceTotal = parseFloat(hotel.offers[0]?.price.total || '0');
      const pricePerNight = Math.round(priceTotal / nights);

      return {
        id: hotel.hotel.hotelId,
        name: hotel.hotel.name,
        rating: parseInt(hotel.hotel.rating) || 4,
        reviewCount: Math.floor(Math.random() * 500) + 100, // API doesn't provide this
        pricePerNight,
        totalPrice: Math.round(priceTotal),
        amenities: hotel.hotel.amenities?.slice(0, 5) || ['WiFi', 'Parking'],
        image: hotel.hotel.media?.[0]?.uri || 'https://placehold.co/400x300',
        location: hotel.hotel.address?.cityName || destination,
      };
    });
  } catch (error) {
    console.error('Error fetching hotels:', error);
    // Fallback to mock data on error
    return calculateHotelTotals(mockHotels, checkIn, checkOut);
  }
}

/**
 * Calculate number of nights between dates
 */
function calculateNights(checkIn: string, checkOut: string): number {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Calculate total prices for mock hotels
 */
function calculateHotelTotals(hotels: Hotel[], checkIn: string, checkOut: string): Hotel[] {
  const nights = calculateNights(checkIn, checkOut);
  return hotels.map(hotel => ({
    ...hotel,
    totalPrice: hotel.pricePerNight * nights,
  }));
}

/**
 * Combined search for both flights and hotels
 */
export async function searchAll(
  origin: string,
  destination: string,
  departDate: string,
  returnDate: string,
  travelers: number
): Promise<{
  outboundFlights: Flight[];
  returnFlights: Flight[];
  hotels: Hotel[];
}> {
  const [outboundFlights, returnFlights, hotels] = await Promise.all([
    searchFlights(origin, destination, departDate, returnDate, 'outbound'),
    searchFlights(destination, origin, returnDate, departDate, 'return'),
    searchHotels(destination, departDate, returnDate, travelers),
  ]);

  return { outboundFlights, returnFlights, hotels };
}
