import { supabase } from '@/integrations/supabase/client';
import { getAirportCode, getCityFromCode, CANDIDATE_DESTINATIONS } from '@/utils/airports';
import { shouldUseMockData } from '@/config/apiSettings';

// Types for flight data
export interface FlightOption {
  id: string;
  price: number;
  airline: string;
  flightNumber: string;
  departure: {
    time: string;
    airport: string;
    city: string;
  };
  arrival: {
    time: string;
    airport: string;
    city: string;
  };
  duration: string;
  layovers: number;
  layoverCities: string[];
  layoverDuration: string;
  bookingUrl: string;
  tier: 'budget' | 'mid' | 'premium';
  airlineLogo?: string;
}

export interface FlightSearchResult {
  origin: string;
  destination: string;
  options: FlightOption[];
  searchUrl: string;
  searchDate: string;
  totalFound?: number;
  error?: string;
  useMock?: boolean;
}

export interface FlightSearchParams {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate: string;
  adults?: number;
}

// Cache configuration
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes
const CACHE_PREFIX = 'flight_search_';

interface CacheEntry {
  data: FlightSearchResult;
  timestamp: number;
}

function getCacheKey(params: FlightSearchParams): string {
  return `${CACHE_PREFIX}${params.origin}_${params.destination}_${params.departureDate}_${params.returnDate}`;
}

function getFromCache(key: string): FlightSearchResult | null {
  try {
    const cached = localStorage.getItem(key);
    if (!cached) return null;
    
    const entry: CacheEntry = JSON.parse(cached);
    const age = Date.now() - entry.timestamp;
    
    if (age < CACHE_DURATION_MS) {
      console.log(`Cache hit for ${key}, age: ${Math.round(age / 1000)}s`);
      return entry.data;
    }
    
    // Cache expired, remove it
    localStorage.removeItem(key);
    return null;
  } catch {
    return null;
  }
}

function setCache(key: string, data: FlightSearchResult): void {
  try {
    const entry: CacheEntry = {
      data,
      timestamp: Date.now(),
    };
    localStorage.setItem(key, JSON.stringify(entry));
  } catch (e) {
    console.warn('Failed to cache flight data:', e);
  }
}

// Mock flight data for fallback
function generateMockFlights(
  origin: string,
  destination: string,
  basePrice: number
): FlightOption[] {
  const airlines = ['United Airlines', 'Delta', 'American', 'TAP Air Portugal', 'Lufthansa', 'British Airways'];
  const randomAirline = () => airlines[Math.floor(Math.random() * airlines.length)];
  
  return [
    {
      id: `mock-budget-${destination}`,
      price: basePrice,
      airline: randomAirline(),
      flightNumber: `UA${Math.floor(Math.random() * 9000) + 1000}`,
      departure: {
        time: '06:00 AM',
        airport: origin,
        city: getCityFromCode(origin) || origin,
      },
      arrival: {
        time: '10:30 PM',
        airport: destination,
        city: getCityFromCode(destination) || destination,
      },
      duration: '16h 30m',
      layovers: 2,
      layoverCities: ['JFK', 'LHR'],
      layoverDuration: '4h total',
      bookingUrl: `https://www.google.com/travel/flights?q=flights+from+${origin}+to+${destination}`,
      tier: 'budget',
    },
    {
      id: `mock-mid-${destination}`,
      price: Math.round(basePrice * 1.2),
      airline: randomAirline(),
      flightNumber: `DL${Math.floor(Math.random() * 9000) + 1000}`,
      departure: {
        time: '10:00 AM',
        airport: origin,
        city: getCityFromCode(origin) || origin,
      },
      arrival: {
        time: '08:45 AM (+1)',
        airport: destination,
        city: getCityFromCode(destination) || destination,
      },
      duration: '13h 45m',
      layovers: 1,
      layoverCities: ['EWR'],
      layoverDuration: '2h',
      bookingUrl: `https://www.google.com/travel/flights?q=flights+from+${origin}+to+${destination}`,
      tier: 'mid',
    },
    {
      id: `mock-premium-${destination}`,
      price: Math.round(basePrice * 1.6),
      airline: randomAirline(),
      flightNumber: `AA${Math.floor(Math.random() * 9000) + 1000}`,
      departure: {
        time: '05:30 PM',
        airport: origin,
        city: getCityFromCode(origin) || origin,
      },
      arrival: {
        time: '09:15 AM (+1)',
        airport: destination,
        city: getCityFromCode(destination) || destination,
      },
      duration: '10h 45m',
      layovers: 0,
      layoverCities: [],
      layoverDuration: '',
      bookingUrl: `https://www.google.com/travel/flights?q=flights+from+${origin}+to+${destination}`,
      tier: 'premium',
    },
  ];
}

/**
 * Fetch flight options from SerpAPI via edge function
 */
export async function fetchFlightOptions(
  params: FlightSearchParams
): Promise<FlightSearchResult> {
  const { origin, destination, departureDate, returnDate, adults = 1 } = params;
  
  // Check cache first
  const cacheKey = getCacheKey(params);
  const cached = getFromCache(cacheKey);
  if (cached) {
    return cached;
  }
  
  // Check if we should use mock data to save API credits
  if (shouldUseMockData()) {
    console.log(`Using mock data for ${origin} → ${destination} (API calls disabled)`);
    const mockResult: FlightSearchResult = {
      origin,
      destination,
      options: generateMockFlights(origin, destination, 450 + Math.random() * 300),
      searchUrl: `https://www.google.com/travel/flights?q=flights+from+${origin}+to+${destination}`,
      searchDate: new Date().toISOString(),
      useMock: true,
    };
    setCache(cacheKey, mockResult);
    return mockResult;
  }
  
  try {
    console.log(`Fetching flights: ${origin} → ${destination}`);
    
    const { data, error } = await supabase.functions.invoke('search-flights', {
      body: {
        origin,
        destination,
        departureDate,
        returnDate,
        adults,
      },
    });
    
    if (error) {
      console.error('Edge function error:', error);
      throw new Error(error.message);
    }
    
    if (data.useMock || data.error) {
      console.warn('Using mock data:', data.error);
      const mockResult: FlightSearchResult = {
        origin,
        destination,
        options: generateMockFlights(origin, destination, 450 + Math.random() * 300),
        searchUrl: `https://www.google.com/travel/flights?q=flights+from+${origin}+to+${destination}`,
        searchDate: new Date().toISOString(),
        useMock: true,
      };
      setCache(cacheKey, mockResult);
      return mockResult;
    }
    
    // Cache successful result
    setCache(cacheKey, data);
    return data;
    
  } catch (error) {
    console.error('Flight search failed:', error);
    
    // Return mock data on failure
    const mockResult: FlightSearchResult = {
      origin,
      destination,
      options: generateMockFlights(origin, destination, 450 + Math.random() * 300),
      searchUrl: `https://www.google.com/travel/flights?q=flights+from+${origin}+to+${destination}`,
      searchDate: new Date().toISOString(),
      useMock: true,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    
    return mockResult;
  }
}

/**
 * Search flights for multiple destinations in parallel
 */
export async function searchFlightsForDestinations(
  originCity: string,
  departureDate: string,
  returnDate: string,
  destinations: string[] = [...CANDIDATE_DESTINATIONS],
  adults: number = 1
): Promise<Map<string, FlightSearchResult>> {
  const originCode = getAirportCode(originCity);
  
  if (!originCode) {
    console.error(`Could not find airport code for: ${originCity}`);
    throw new Error(`Could not find airport code for "${originCity}"`);
  }
  
  console.log(`Searching flights from ${originCode} to ${destinations.length} destinations`);
  
  const results = new Map<string, FlightSearchResult>();
  
  // Search in parallel with concurrency limit
  const BATCH_SIZE = 4;
  for (let i = 0; i < destinations.length; i += BATCH_SIZE) {
    const batch = destinations.slice(i, i + BATCH_SIZE);
    
    const batchResults = await Promise.allSettled(
      batch.map(dest =>
        fetchFlightOptions({
          origin: originCode,
          destination: dest,
          departureDate,
          returnDate,
          adults,
        })
      )
    );
    
    batchResults.forEach((result, index) => {
      const destCode = batch[index];
      if (result.status === 'fulfilled') {
        results.set(destCode, result.value);
      } else {
        console.error(`Failed to fetch flights to ${destCode}:`, result.reason);
        // Still add mock data for failed requests
        results.set(destCode, {
          origin: originCode,
          destination: destCode,
          options: generateMockFlights(originCode, destCode, 450 + Math.random() * 300),
          searchUrl: `https://www.google.com/travel/flights?q=flights+from+${originCode}+to+${destCode}`,
          searchDate: new Date().toISOString(),
          useMock: true,
          error: result.reason?.message || 'Search failed',
        });
      }
    });
  }
  
  return results;
}

/**
 * Get the cheapest flight price for a destination
 */
export function getCheapestPrice(result: FlightSearchResult): number {
  if (!result.options.length) return 0;
  return Math.min(...result.options.map(o => o.price));
}

/**
 * Get flight by tier
 */
export function getFlightByTier(
  result: FlightSearchResult,
  tier: 'budget' | 'mid' | 'premium'
): FlightOption | null {
  return result.options.find(o => o.tier === tier) || null;
}

/**
 * Clear flight cache
 */
export function clearFlightCache(): void {
  const keys = Object.keys(localStorage);
  keys.forEach(key => {
    if (key.startsWith(CACHE_PREFIX)) {
      localStorage.removeItem(key);
    }
  });
  console.log('Flight cache cleared');
}
