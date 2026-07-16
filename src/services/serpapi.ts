import { supabase } from '@/integrations/supabase/client';
import { getAirportCode, expandAirportSearch, CANDIDATE_DESTINATIONS } from '@/utils/airports';

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
  durationMinutes?: number;
  layovers: number;
  layoverCities: string[];
  layoverDuration: string;
  bookingUrl: string;
  bookingToken?: string;
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
  cheapestPrice?: number;
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
  /** Max total ticket price (all passengers) — budget envelope transport cap */
  maxPrice?: number;
  /** Deeper Google Flights inventory (slower; use for single-destination page) */
  deepSearch?: boolean;
  /** Multi-airport origin/destination expansion for cheaper fares */
  expandAirports?: boolean;
}

// Cache configuration — bust when budget search params change
const CACHE_DURATION_MS = 45 * 60 * 1000; // 45 min
const CACHE_PREFIX = 'flight_search_v3_';

interface CacheEntry {
  data: FlightSearchResult;
  timestamp: number;
}

function getCacheKey(params: FlightSearchParams): string {
  return `${CACHE_PREFIX}${params.origin}_${params.destination}_${params.departureDate}_${params.returnDate}_${params.adults || 1}_${params.maxPrice || 'any'}_${params.deepSearch ? 'deep' : 'fast'}`;
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
 * Fetch flight options from SerpAPI via edge function (budget-first).
 * NO mock fallback — throws on error so callers show real error states.
 */
export async function fetchFlightOptions(
  params: FlightSearchParams
): Promise<FlightSearchResult> {
  const {
    origin: rawOrigin,
    destination: rawDest,
    departureDate,
    returnDate,
    adults = 1,
    cabin = 'economy',
    maxPrice,
    deepSearch = false,
    expandAirports = true,
  } = params;

  const expandedOrigin = expandAirports ? expandAirportSearch(rawOrigin) || rawOrigin : rawOrigin;
  const expandedDest = expandAirports ? expandAirportSearch(rawDest) || rawDest : rawDest;
  // Prefer multi-airport (cheaper inventory); fall back to single codes if edge rejects list
  const originCandidates = Array.from(
    new Set([expandedOrigin, rawOrigin.split(',')[0].toUpperCase()].filter(Boolean))
  );
  const destCandidates = Array.from(
    new Set([expandedDest, rawDest.split(',')[0].toUpperCase()].filter(Boolean))
  );

  const resolvedParams: FlightSearchParams = {
    ...params,
    origin: originCandidates[0],
    destination: destCandidates[0],
  };

  // Check cache first
  const cacheKey = getCacheKey(resolvedParams);
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  if (import.meta.env.DEV) {
    console.log(
      `Fetching flights (budget-first): ${originCandidates[0]} → ${destCandidates[0]}${maxPrice ? ` max$${maxPrice}` : ''}${deepSearch ? ' deep' : ''}`
    );
  }

  let data: any = null;
  let lastError: Error | null = null;

  outer: for (const origin of originCandidates) {
    for (const destination of destCandidates) {
      const { data: resp, error } = await supabase.functions.invoke('search-flights', {
        body: {
          origin,
          destination,
          departureDate,
          returnDate,
          adults,
          cabin,
          maxPrice,
          deepSearch,
          showHidden: true,
        },
      });

      if (error) {
        lastError = new Error(`Flight search failed: ${error.message}`);
        continue;
      }
      if (resp?.ok === false) {
        // Validation errors (e.g. multi-airport not deployed yet) → try simpler codes
        lastError = new Error(resp.error || 'Flight search returned an error');
        continue;
      }
      data = resp;
      resolvedParams.origin = origin;
      resolvedParams.destination = destination;
      break outer;
    }
  }

  if (!data) {
    throw lastError || new Error('Flight search failed');
  }

  const origin = resolvedParams.origin;
  const destination = resolvedParams.destination;

  // Normalize into FlightSearchResult. Ensure each option has a bookable Google Flights URL.
  const searchUrl =
    data.searchUrl ||
    `https://www.google.com/travel/flights?q=Flights%20to%20${encodeURIComponent(destination)}%20from%20${encodeURIComponent(origin)}%20on%20${departureDate}%20through%20${returnDate}&curr=USD`;

  let options: FlightOption[] = (data.options ?? []).map((opt: FlightOption, idx: number) => ({
    ...opt,
    id: opt.id || `flight-${idx}`,
    bookingUrl: opt.bookingUrl || searchUrl,
  }));

  // Client-side safety: cheapest first, optional budget cap, dedupe
  options = options
    .filter((o) => typeof o.price === 'number' && o.price > 0)
    .filter((o) => (typeof maxPrice === 'number' ? o.price <= maxPrice : true))
    .sort((a, b) => a.price - b.price || (a.layovers ?? 9) - (b.layovers ?? 9));

  const result: FlightSearchResult = {
    origin: data.origin ?? origin,
    destination: data.destination ?? destination,
    options,
    searchUrl,
    searchDate: data.searchDate ?? new Date().toISOString(),
    totalFound: data.totalFound ?? options.length,
    cheapestPrice: options[0]?.price ?? data.cheapestPrice,
    useMock: false,
  };

  setCache(cacheKey, result);
  return result;
}

/**
 * Search flights for multiple destinations in parallel (budget discovery).
 * Uses fast mode (no deep_search) + multi-airport origins for cheapest fares.
 */
export async function searchFlightsForDestinations(
  originCity: string,
  departureDate: string,
  returnDate: string,
  destinations: string[] = [...CANDIDATE_DESTINATIONS],
  adults: number = 1,
  cabin: string = 'economy',
  maxPrice?: number
): Promise<Map<string, FlightSearchResult>> {
  const originCode = getAirportCode(originCity);

  if (!originCode) {
    throw new Error(`Could not find airport code for "${originCity}"`);
  }

  if (import.meta.env.DEV) {
    console.log(
      `Searching cheapest flights from ${originCode} to ${destinations.length} destinations${maxPrice ? ` (cap $${maxPrice})` : ''}`
    );
  }

  const results = new Map<string, FlightSearchResult>();

  // Slightly larger batches — budget discovery needs breadth
  const BATCH_SIZE = 5;
  for (let i = 0; i < destinations.length; i += BATCH_SIZE) {
    const batch = destinations.slice(i, i + BATCH_SIZE);

    const batchResults = await Promise.allSettled(
      batch.map((dest) =>
        fetchFlightOptions({
          origin: originCode,
          destination: dest,
          departureDate,
          returnDate,
          adults,
          cabin,
          maxPrice,
          deepSearch: false,
          expandAirports: true,
        })
      )
    );

    batchResults.forEach((result, index) => {
      const destCode = batch[index];
      if (result.status === 'fulfilled') {
        // Key by primary dest code (first of multi-airport list)
        results.set(destCode, result.value);
      } else {
        if (import.meta.env.DEV) console.error(`Failed to fetch flights to ${destCode}:`, result.reason);
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
