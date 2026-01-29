// API Service Layer with Mock Fallbacks
// Toggle USE_MOCK_DATA for development

import type { Destination, DestinationMatch } from '@/types/destination';
import type { DayPlan } from '@/types/itinerary';
import { destinations } from '@/data/destinations';
import { matchDestinations, getGhostTrips } from '@/lib/destinationMatcher';
import { createLisbonItinerary } from '@/data/lisbonItinerary';
import { mockFlights, mockReturnFlights, mockHotels } from '@/data/mockData';

// Configuration
export const API_CONFIG = {
  USE_MOCK_DATA: true, // Set to false when API keys are configured
  MAX_RETRIES: 3,
  RETRY_DELAY_MS: 1000,
  ENDPOINTS: {
    SERP_API: 'https://serpapi.com/search',
    AMADEUS: 'https://api.amadeus.com/v2',
    TRIPADVISOR: 'https://api.tripadvisor.com/api/v1',
    OPENWEATHER: 'https://api.openweathermap.org/data/2.5',
    OPENAI: 'https://api.openai.com/v1',
  },
};

// Types
export interface SearchParams {
  budget: number;
  days: number;
  departureCity: string;
  dates: { start: Date; end: Date };
  regions: string[];
  travelStyle: 'budget' | 'mid' | 'luxury';
  travelers: number;
  interests?: string[];
}

export interface FlightDetails {
  id: string;
  airline: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  stops: number;
  price: number;
  departure: { airport: string; city: string };
  arrival: { airport: string; city: string };
}

export interface HotelOption {
  id: string;
  name: string;
  tier: '3-star' | '4-star' | '5-star';
  pricePerNight: number;
  totalPrice: number;
  rating: number;
  reviewCount: number;
  amenities: string[];
  image: string;
  neighborhood: string;
}

export interface Activity {
  id: string;
  name: string;
  description: string;
  cost: number;
  duration: string;
  rating: number;
  reviewCount: number;
  category: string;
  image: string;
  bookingUrl?: string;
}

export interface WeatherForecast {
  date: Date;
  temp: number;
  condition: 'sunny' | 'partly-cloudy' | 'rainy' | 'cold' | 'hot';
  icon: string;
  description: string;
}

export interface ConfidenceBreakdown {
  overall: number;
  weather: number;
  crowds: number;
  value: number;
  dataQuality: number;
}

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  isLoading: boolean;
  isMocked: boolean;
}

// Utility: Retry logic with exponential backoff
async function fetchWithRetry<T>(
  fetchFn: () => Promise<T>,
  retries = API_CONFIG.MAX_RETRIES
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await fetchFn();
    } catch (error) {
      lastError = error as Error;
      if (attempt < retries - 1) {
        await new Promise(resolve => 
          setTimeout(resolve, API_CONFIG.RETRY_DELAY_MS * Math.pow(2, attempt))
        );
      }
    }
  }
  
  throw lastError;
}

// Utility: Delay for staggered loading effects
export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// ============================================
// 1. SEARCH DESTINATIONS
// ============================================
export async function searchDestinations(params: SearchParams): Promise<ApiResponse<{
  matches: DestinationMatch[];
  ghostTrips: DestinationMatch[];
}>> {
  try {
    if (API_CONFIG.USE_MOCK_DATA) {
      // Simulate API delay
      await delay(800 + Math.random() * 400);
      
      const matches = matchDestinations({
        budget: params.budget,
        startDate: params.dates.start,
        endDate: params.dates.end,
        travelers: params.travelers,
        tripStyle: params.travelStyle,
        interests: params.interests,
        regions: params.regions as any,
      });
      
      const ghostTrips = getGhostTrips({
        budget: params.budget,
        startDate: params.dates.start,
        endDate: params.dates.end,
        travelers: params.travelers,
        tripStyle: params.travelStyle,
        interests: params.interests,
        regions: params.regions as any,
      });
      
      return {
        data: { matches, ghostTrips },
        error: null,
        isLoading: false,
        isMocked: true,
      };
    }
    
    // Real API call would go here
    const result = await fetchWithRetry(async () => {
      // TODO: Implement real SerpAPI call
      throw new Error('Real API not implemented');
    });
    
    return {
      data: result as any,
      error: null,
      isLoading: false,
      isMocked: false,
    };
  } catch (error) {
    console.error('searchDestinations error:', error);
    
    // Fallback to mock data on error
    const matches = matchDestinations({
      budget: params.budget,
      startDate: params.dates.start,
      endDate: params.dates.end,
      travelers: params.travelers,
      tripStyle: params.travelStyle,
      interests: params.interests,
      regions: params.regions as any,
    });
    
    return {
      data: { matches, ghostTrips: [] },
      error: 'Using cached results',
      isLoading: false,
      isMocked: true,
    };
  }
}

// ============================================
// 2. GET FLIGHT DETAILS
// ============================================
export async function getFlightDetails(
  destination: string,
  dates: { start: Date; end: Date },
  departureCity: string
): Promise<ApiResponse<{ outbound: FlightDetails[]; return: FlightDetails[] }>> {
  try {
    if (API_CONFIG.USE_MOCK_DATA) {
      await delay(600 + Math.random() * 300);
      
      // Customize mock flights based on destination
      const outboundFlights: FlightDetails[] = mockFlights.map(f => ({
        ...f,
        arrival: { airport: destination.slice(0, 3).toUpperCase(), city: destination },
        departure: { airport: departureCity.slice(0, 3).toUpperCase(), city: departureCity },
      }));
      
      const returnFlights: FlightDetails[] = mockReturnFlights.map(f => ({
        ...f,
        departure: { airport: destination.slice(0, 3).toUpperCase(), city: destination },
        arrival: { airport: departureCity.slice(0, 3).toUpperCase(), city: departureCity },
      }));
      
      return {
        data: { outbound: outboundFlights, return: returnFlights },
        error: null,
        isLoading: false,
        isMocked: true,
      };
    }
    
    // Real SerpAPI Google Flights call
    const result = await fetchWithRetry(async () => {
      // TODO: Implement real SerpAPI call
      throw new Error('Real API not implemented');
    });
    
    return {
      data: result as any,
      error: null,
      isLoading: false,
      isMocked: false,
    };
  } catch (error) {
    console.error('getFlightDetails error:', error);
    
    return {
      data: { 
        outbound: mockFlights as FlightDetails[], 
        return: mockReturnFlights as FlightDetails[] 
      },
      error: 'Using cached flight data',
      isLoading: false,
      isMocked: true,
    };
  }
}

// ============================================
// 3. SEARCH HOTELS
// ============================================
export async function searchHotels(
  destination: string,
  dates: { start: Date; end: Date },
  budget: number
): Promise<ApiResponse<HotelOption[]>> {
  try {
    if (API_CONFIG.USE_MOCK_DATA) {
      await delay(700 + Math.random() * 300);
      
      // Find destination data for hotel options
      const destData = destinations.find(
        d => d.name.toLowerCase() === destination.toLowerCase()
      );
      
      const nights = Math.ceil(
        (dates.end.getTime() - dates.start.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      // Generate hotel options based on destination data or defaults
      const hotelOptions: HotelOption[] = destData?.hotelOptions?.map((hotel, idx) => ({
        id: `hotel-${idx}`,
        name: hotel.name,
        tier: hotel.tier,
        pricePerNight: hotel.pricePerNight,
        totalPrice: hotel.pricePerNight * nights,
        rating: hotel.rating,
        reviewCount: Math.floor(500 + Math.random() * 2500),
        amenities: hotel.amenities,
        image: mockHotels[idx]?.image || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
        neighborhood: hotel.neighborhood,
      })) || mockHotels.slice(0, 3).map((h, idx) => ({
        id: h.id,
        name: h.name,
        tier: (['3-star', '4-star', '5-star'] as const)[idx],
        pricePerNight: h.pricePerNight,
        totalPrice: h.pricePerNight * nights,
        rating: h.rating,
        reviewCount: h.reviewCount,
        amenities: h.amenities,
        image: h.image,
        neighborhood: h.location,
      }));
      
      return {
        data: hotelOptions,
        error: null,
        isLoading: false,
        isMocked: true,
      };
    }
    
    // Real Amadeus API call
    const result = await fetchWithRetry(async () => {
      // TODO: Implement real Amadeus call
      throw new Error('Real API not implemented');
    });
    
    return {
      data: result as any,
      error: null,
      isLoading: false,
      isMocked: false,
    };
  } catch (error) {
    console.error('searchHotels error:', error);
    
    return {
      data: mockHotels.slice(0, 3) as unknown as HotelOption[],
      error: 'Using cached hotel data',
      isLoading: false,
      isMocked: true,
    };
  }
}

// ============================================
// 4. GET ACTIVITIES
// ============================================
const MOCK_ACTIVITIES: Record<string, Activity[]> = {
  lisbon: [
    { id: 'act-1', name: 'Belém Tower', description: 'UNESCO World Heritage fortress', cost: 8, duration: '1h', rating: 4.7, reviewCount: 12500, category: 'Historical', image: 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=800' },
    { id: 'act-2', name: 'Jerónimos Monastery', description: 'Stunning Manueline architecture', cost: 10, duration: '2h', rating: 4.8, reviewCount: 15200, category: 'Historical', image: 'https://images.unsplash.com/photo-1548707309-dcebeab9ea9b?w=800' },
    { id: 'act-3', name: 'Time Out Market', description: 'Food hall with 40+ vendors', cost: 0, duration: '1.5h', rating: 4.5, reviewCount: 8900, category: 'Food & Drink', image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800' },
    { id: 'act-4', name: 'São Jorge Castle', description: 'Moorish castle with panoramic views', cost: 10, duration: '2h', rating: 4.6, reviewCount: 11200, category: 'Historical', image: 'https://images.unsplash.com/photo-1585208798174-6cedd86e019a?w=800' },
    { id: 'act-5', name: 'Tram 28 Ride', description: 'Iconic vintage tram through old Lisbon', cost: 3, duration: '45min', rating: 4.4, reviewCount: 7800, category: 'Transport', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800' },
    { id: 'act-6', name: 'Alfama Walking Tour', description: 'Explore the oldest neighborhood', cost: 0, duration: '2h', rating: 4.8, reviewCount: 6500, category: 'Tours', image: 'https://images.unsplash.com/photo-1536663815808-535e2280d2c2?w=800' },
    { id: 'act-7', name: 'Fado Show', description: 'Traditional Portuguese music experience', cost: 30, duration: '2h', rating: 4.9, reviewCount: 4200, category: 'Entertainment', image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800' },
    { id: 'act-8', name: 'Sintra Day Trip', description: 'Fairytale palaces and gardens', cost: 14, duration: '8h', rating: 4.9, reviewCount: 18500, category: 'Day Trips', image: 'https://images.unsplash.com/photo-1555881400-69433c3c9f13?w=800' },
    { id: 'act-9', name: 'LX Factory', description: 'Creative hub with shops and cafes', cost: 0, duration: '2h', rating: 4.5, reviewCount: 5600, category: 'Shopping', image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800' },
    { id: 'act-10', name: 'MAAT Museum', description: 'Contemporary art and architecture', cost: 9, duration: '1.5h', rating: 4.3, reviewCount: 3800, category: 'Museums', image: 'https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?w=800' },
  ],
  default: [
    { id: 'act-1', name: 'City Walking Tour', description: 'Explore the historic center', cost: 0, duration: '2h', rating: 4.6, reviewCount: 5000, category: 'Tours', image: 'https://images.unsplash.com/photo-1569880153113-76e33fc52d5f?w=800' },
    { id: 'act-2', name: 'Local Food Tour', description: 'Taste authentic local cuisine', cost: 45, duration: '3h', rating: 4.8, reviewCount: 3200, category: 'Food & Drink', image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800' },
    { id: 'act-3', name: 'Museum Visit', description: 'Discover local history and art', cost: 15, duration: '2h', rating: 4.5, reviewCount: 4100, category: 'Museums', image: 'https://images.unsplash.com/photo-1554907984-15263bfd63bd?w=800' },
    { id: 'act-4', name: 'Sunset Viewpoint', description: 'Best panoramic views of the city', cost: 0, duration: '1h', rating: 4.9, reviewCount: 8700, category: 'Attractions', image: 'https://images.unsplash.com/photo-1507400492013-162706c8c05e?w=800' },
    { id: 'act-5', name: 'Local Market', description: 'Shop for authentic souvenirs', cost: 0, duration: '1.5h', rating: 4.4, reviewCount: 2900, category: 'Shopping', image: 'https://images.unsplash.com/photo-1533900298318-6b8da08a523e?w=800' },
  ],
};

export async function getActivities(
  destination: string
): Promise<ApiResponse<Activity[]>> {
  try {
    if (API_CONFIG.USE_MOCK_DATA) {
      await delay(500 + Math.random() * 300);
      
      const key = destination.toLowerCase();
      const activities = MOCK_ACTIVITIES[key] || MOCK_ACTIVITIES.default;
      
      return {
        data: activities,
        error: null,
        isLoading: false,
        isMocked: true,
      };
    }
    
    // Real TripAdvisor API call
    const result = await fetchWithRetry(async () => {
      // TODO: Implement real TripAdvisor call
      throw new Error('Real API not implemented');
    });
    
    return {
      data: result as any,
      error: null,
      isLoading: false,
      isMocked: false,
    };
  } catch (error) {
    console.error('getActivities error:', error);
    
    return {
      data: MOCK_ACTIVITIES.default,
      error: 'Using cached activities',
      isLoading: false,
      isMocked: true,
    };
  }
}

// ============================================
// 5. GENERATE ITINERARY
// ============================================
export async function generateItinerary(
  destination: string,
  days: number,
  budgetAllocation: Record<string, number>,
  preferences: {
    tripStyle: string;
    interests: string[];
  }
): Promise<ApiResponse<DayPlan[]>> {
  try {
    if (API_CONFIG.USE_MOCK_DATA) {
      // Simulate longer AI generation time
      await delay(1500 + Math.random() * 500);
      
      const dailyBudget = Math.round(
        Object.values(budgetAllocation).reduce((a, b) => a + b, 0) / days
      );
      
      // For now, always return Lisbon itinerary as mock
      const itinerary = createLisbonItinerary(new Date(), dailyBudget);
      
      return {
        data: itinerary.slice(0, days),
        error: null,
        isLoading: false,
        isMocked: true,
      };
    }
    
    // Real OpenAI GPT-4 call
    const result = await fetchWithRetry(async () => {
      // TODO: Implement real OpenAI call with structured prompting
      throw new Error('Real API not implemented');
    });
    
    return {
      data: result as any,
      error: null,
      isLoading: false,
      isMocked: false,
    };
  } catch (error) {
    console.error('generateItinerary error:', error);
    
    return {
      data: createLisbonItinerary(new Date(), 300),
      error: 'Using pre-built itinerary',
      isLoading: false,
      isMocked: true,
    };
  }
}

// ============================================
// 6. GET WEATHER FORECAST
// ============================================
export async function getWeatherForecast(
  destination: string,
  dates: { start: Date; end: Date }
): Promise<ApiResponse<WeatherForecast[]>> {
  try {
    if (API_CONFIG.USE_MOCK_DATA) {
      await delay(400 + Math.random() * 200);
      
      // Find destination to get seasonal weather
      const destData = destinations.find(
        d => d.name.toLowerCase() === destination.toLowerCase()
      );
      
      const forecasts: WeatherForecast[] = [];
      const days = Math.ceil(
        (dates.end.getTime() - dates.start.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      for (let i = 0; i <= days; i++) {
        const date = new Date(dates.start);
        date.setDate(date.getDate() + i);
        const month = date.getMonth() + 1;
        
        const weather = destData?.weather[month];
        const conditions: Array<'sunny' | 'partly-cloudy' | 'rainy' | 'cold' | 'hot'> = 
          ['sunny', 'partly-cloudy', 'rainy', 'cold', 'hot'];
        
        forecasts.push({
          date,
          temp: weather?.temp || 70 + Math.random() * 15,
          condition: weather?.condition || conditions[Math.floor(Math.random() * 3)],
          icon: weather?.condition === 'sunny' ? '☀️' : 
                weather?.condition === 'partly-cloudy' ? '⛅' :
                weather?.condition === 'rainy' ? '🌧️' :
                weather?.condition === 'cold' ? '❄️' : '🌡️',
          description: weather?.condition === 'sunny' ? 'Clear skies' :
                       weather?.condition === 'partly-cloudy' ? 'Partly cloudy' :
                       weather?.condition === 'rainy' ? 'Showers expected' :
                       weather?.condition === 'cold' ? 'Cold weather' : 'Hot weather',
        });
      }
      
      return {
        data: forecasts,
        error: null,
        isLoading: false,
        isMocked: true,
      };
    }
    
    // Real OpenWeather API call
    const result = await fetchWithRetry(async () => {
      // TODO: Implement real OpenWeather call
      throw new Error('Real API not implemented');
    });
    
    return {
      data: result as any,
      error: null,
      isLoading: false,
      isMocked: false,
    };
  } catch (error) {
    console.error('getWeatherForecast error:', error);
    
    return {
      data: [],
      error: 'Weather data unavailable',
      isLoading: false,
      isMocked: true,
    };
  }
}

// ============================================
// 7. CALCULATE CONFIDENCE SCORE
// ============================================
export function calculateConfidenceScore(
  destination: Destination,
  startDate: Date,
  endDate: Date
): ConfidenceBreakdown {
  const month = startDate.getMonth() + 1;
  const weather = destination.weather[month];
  
  // Weather score (0-100)
  let weatherScore = 50;
  if (weather) {
    if (weather.condition === 'sunny') weatherScore = 95;
    else if (weather.condition === 'partly-cloudy') weatherScore = 80;
    else if (weather.condition === 'rainy') weatherScore = 40;
    else if (weather.condition === 'hot') weatherScore = 60;
    else if (weather.condition === 'cold') weatherScore = 55;
    
    // Adjust for temperature
    if (weather.temp >= 70 && weather.temp <= 85) weatherScore += 5;
    else if (weather.temp < 50 || weather.temp > 95) weatherScore -= 10;
  }
  
  // Crowd score (higher = less crowded = better)
  let crowdScore = 70;
  if (weather) {
    crowdScore = 100 - (weather.crowdLevel - 1) * 20;
  }
  
  // Value score based on costs
  const valueScore = Math.min(100, Math.max(0, 
    100 - (destination.costs.mid / 200) * 50 + 
    (destination.highlights.length * 5)
  ));
  
  // Data quality score
  const dataQuality = Math.min(100, 
    70 + 
    (destination.highlights.length * 3) + 
    (destination.tags.length * 2) +
    (destination.hotelOptions ? 10 : 0) +
    (destination.pros ? 5 : 0)
  );
  
  // Overall weighted average
  const overall = Math.round(
    (weatherScore * 0.25) +
    (crowdScore * 0.2) +
    (valueScore * 0.35) +
    (dataQuality * 0.2)
  );
  
  return {
    overall: Math.min(98, Math.max(70, overall)),
    weather: Math.round(weatherScore),
    crowds: Math.round(crowdScore),
    value: Math.round(valueScore),
    dataQuality: Math.round(dataQuality),
  };
}

// ============================================
// HOOKS FOR REACT QUERY INTEGRATION
// ============================================
export const apiKeys = {
  destinations: (params: SearchParams) => ['destinations', params] as const,
  flights: (destination: string, dates: { start: Date; end: Date }) => 
    ['flights', destination, dates] as const,
  hotels: (destination: string, dates: { start: Date; end: Date }, budget: number) => 
    ['hotels', destination, dates, budget] as const,
  activities: (destination: string) => ['activities', destination] as const,
  itinerary: (destination: string, days: number) => 
    ['itinerary', destination, days] as const,
  weather: (destination: string, dates: { start: Date; end: Date }) => 
    ['weather', destination, dates] as const,
};
