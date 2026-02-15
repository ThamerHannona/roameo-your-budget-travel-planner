import { supabase } from '@/integrations/supabase/client';

// Types for hotel data
export interface HotelOption {
  id: string;
  name: string;
  pricePerNight: number;
  totalPrice: number;
  rating: number;
  reviewCount: number;
  tier: '3-star' | '4-star' | '5-star';
  amenities: string[];
  imageUrl: string;
  bookingUrl: string;
  location: string;
}

export interface HotelSearchResult {
  destination: string;
  options: HotelOption[];
  searchUrl: string;
  searchDate: string;
  totalFound?: number;
  error?: string;
  useMock?: boolean;
}

export interface HotelSearchParams {
  destination: string;
  checkIn: string;
  checkOut: string;
  adults?: number;
}

// Cache configuration
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes
const CACHE_PREFIX = 'hotel_search_';

interface CacheEntry {
  data: HotelSearchResult;
  timestamp: number;
}

function getCacheKey(params: HotelSearchParams): string {
  return `${CACHE_PREFIX}${params.destination}_${params.checkIn}_${params.checkOut}`;
}

function getFromCache(key: string): HotelSearchResult | null {
  try {
    const cached = localStorage.getItem(key);
    if (!cached) return null;
    const entry: CacheEntry = JSON.parse(cached);
    if (Date.now() - entry.timestamp < CACHE_DURATION_MS) {
      if (import.meta.env.DEV) console.log(`Hotel cache hit for ${key}`);
      return entry.data;
    }
    localStorage.removeItem(key);
    return null;
  } catch {
    return null;
  }
}

function setCache(key: string, data: HotelSearchResult): void {
  try {
    localStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }));
  } catch (e) {
    if (import.meta.env.DEV) console.warn('Failed to cache hotel data:', e);
  }
}

function categorizeTier(rating: number | null, price: number | null, index: number, total: number): '3-star' | '4-star' | '5-star' {
  if (rating !== null) {
    if (rating >= 4.5) return '5-star';
    if (rating >= 4.0) return '4-star';
    return '3-star';
  }
  // Fallback: use position in sorted list
  if (total <= 1) return '4-star';
  if (index === 0) return '3-star';
  if (index === total - 1) return '5-star';
  return '4-star';
}

function calculateNights(checkIn: string, checkOut: string): number {
  return Math.max(1, Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)));
}

/**
 * Fetch hotel options from SerpAPI via edge function - NO mock fallback
 */
export async function fetchHotelOptions(
  params: HotelSearchParams
): Promise<HotelSearchResult> {
  const { destination, checkIn, checkOut, adults = 2 } = params;
  const nights = calculateNights(checkIn, checkOut);

  // Check cache first
  const cacheKey = getCacheKey(params);
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  if (import.meta.env.DEV) console.log(`Fetching hotels in: ${destination}`);

  const { data, error } = await supabase.functions.invoke('search-hotels', {
    body: { destination, checkIn, checkOut, adults },
  });

  if (error) {
    throw new Error(`Hotel search failed: ${error.message}`);
  }

  if (data.ok === false) {
    throw new Error(data.error || 'Hotel search returned an error');
  }

  // Normalize the new response format into HotelOption[]
  const rawResults: any[] = data.results || [];
  const searchUrl = data.searchUrl || `https://www.google.com/travel/hotels?q=hotels+in+${encodeURIComponent(destination)}`;

  if (rawResults.length === 0) {
    const emptyResult: HotelSearchResult = {
      destination,
      options: [],
      searchUrl,
      searchDate: new Date().toISOString(),
      totalFound: 0,
    };
    return emptyResult;
  }

  // Sort by price for tier assignment
  const withPrices = rawResults.filter(r => r.price || r.totalPrice || r.pricePerNight);
  withPrices.sort((a, b) => (a.price || a.pricePerNight || 0) - (b.price || b.pricePerNight || 0));

  const options: HotelOption[] = withPrices.map((r, idx) => {
    const pricePerNight = r.pricePerNight || r.price || 0;
    const totalPrice = r.totalPrice || pricePerNight * nights;
    return {
      id: `hotel-${idx}-${Date.now()}`,
      name: r.name,
      pricePerNight: Math.round(pricePerNight),
      totalPrice: Math.round(totalPrice),
      rating: r.rating || 0,
      reviewCount: r.reviews || 0,
      tier: categorizeTier(r.rating, pricePerNight, idx, withPrices.length),
      amenities: r.amenities || [],
      imageUrl: r.thumbnail || 'https://placehold.co/400x300',
      bookingUrl: r.link || searchUrl,
      location: destination,
    };
  });

  // Pick representative hotels per tier (budget/mid/premium)
  let selectedOptions = options;
  if (options.length > 3) {
    const budget = options[0];
    const mid = options[Math.floor(options.length / 2)];
    const premium = [...options].sort((a, b) => (b.rating || 0) - (a.rating || 0))[0];

    const seen = new Set<string>();
    selectedOptions = [
      { ...budget, tier: '3-star' as const },
      { ...mid, tier: '4-star' as const },
      { ...premium, tier: '5-star' as const },
    ].filter(h => {
      if (seen.has(h.name)) return false;
      seen.add(h.name);
      return true;
    });
  }

  const result: HotelSearchResult = {
    destination,
    options: selectedOptions,
    searchUrl,
    searchDate: new Date().toISOString(),
    totalFound: data.totalFound || rawResults.length,
  };

  setCache(cacheKey, result);
  return result;
}

/**
 * Get hotel by tier
 */
export function getHotelByTier(
  result: HotelSearchResult,
  tier: '3-star' | '4-star' | '5-star'
): HotelOption | null {
  return result.options.find(o => o.tier === tier) || null;
}

/**
 * Clear hotel cache
 */
export function clearHotelCache(): void {
  const keys = Object.keys(localStorage);
  keys.forEach(key => {
    if (key.startsWith(CACHE_PREFIX)) {
      localStorage.removeItem(key);
    }
  });
  if (import.meta.env.DEV) console.log('Hotel cache cleared');
}
