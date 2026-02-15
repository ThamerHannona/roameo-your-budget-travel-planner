import { supabase } from '@/integrations/supabase/client';
import { getAirportCode, getCityFromCode, CANDIDATE_DESTINATIONS } from '@/utils/airports';

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
  cabin?: string;
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
      if (import.meta.env.DEV) console.log(`Cache hit for ${key}, age: ${Math.round(age / 1000)}s`);
      return entry.data;
    }
    localStorage.removeItem(key);
    return null;
  } catch {
    return null;
  }
}

function setCache(key: string, data: FlightSearchResult): void {
  try {
    const entry: CacheEntry = { data, timestamp: Date.now() };
    localStorage.setItem(key, JSON.stringify(entry));
  } catch (e) {
    if (import.meta.env.DEV) console.warn('Failed to cache flight data:', e);
  }
}

/**
 * Fetch flight options from SerpAPI via edge function.
 * NO mock fallback — throws on error so callers show real error states.
 */
export async function fetchFlightOptions(
  params: FlightSearchParams
): Promise<FlightSearchResult> {
  const { origin, destination, departureDate, returnDate, adults = 1, cabin = 'economy' } = params;

  // Check cache first
  const cacheKey = getCacheKey(params);
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  if (import.meta.env.DEV) console.log(`Fetching flights: ${origin} → ${destination}`);

  const { data, error } = await supabase.functions.invoke('search-flights', {
    body: { origin, destination, departureDate, returnDate, adults, cabin },
  });

  if (error) {
    throw new Error(`Flight search failed: ${error.message}`);
  }

  if (data.ok === false) {
    throw new Error(data.error || 'Flight search returned an error');
  }

  // Normalize into FlightSearchResult
  const result: FlightSearchResult = {
    origin: data.origin ?? origin,
    destination: data.destination ?? destination,
    options: data.options ?? [],
    searchUrl: data.searchUrl ?? '',
    searchDate: data.searchDate ?? new Date().toISOString(),
    totalFound: data.totalFound,
    useMock: false,
  };

  setCache(cacheKey, result);
  return result;
}

/**
 * Search flights for multiple destinations in parallel.
 * Individual failures are captured per-destination (with error info), not swallowed with mock data.
 */
export async function searchFlightsForDestinations(
  originCity: string,
  departureDate: string,
  returnDate: string,
  destinations: string[] = [...CANDIDATE_DESTINATIONS],
  adults: number = 1,
  cabin: string = 'economy'
): Promise<Map<string, FlightSearchResult>> {
  const originCode = getAirportCode(originCity);

  if (!originCode) {
    throw new Error(`Could not find airport code for "${originCity}"`);
  }

  if (import.meta.env.DEV) console.log(`Searching flights from ${originCode} to ${destinations.length} destinations`);

  const results = new Map<string, FlightSearchResult>();

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
          cabin,
        })
      )
    );

    batchResults.forEach((result, index) => {
      const destCode = batch[index];
      if (result.status === 'fulfilled') {
        results.set(destCode, result.value);
      } else {
        if (import.meta.env.DEV) console.error(`Failed to fetch flights to ${destCode}:`, result.reason);
        // Store an error result — NO mock fallback
        results.set(destCode, {
          origin: originCode,
          destination: destCode,
          options: [],
          searchUrl: '',
          searchDate: new Date().toISOString(),
          useMock: false,
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
  if (import.meta.env.DEV) console.log('Flight cache cleared');
}
