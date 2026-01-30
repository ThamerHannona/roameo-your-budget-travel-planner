import { supabase } from '@/integrations/supabase/client';
import { shouldUseMockData } from '@/config/apiSettings';

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
    const age = Date.now() - entry.timestamp;
    
    if (age < CACHE_DURATION_MS) {
      console.log(`Hotel cache hit for ${key}, age: ${Math.round(age / 1000)}s`);
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
    const entry: CacheEntry = {
      data,
      timestamp: Date.now(),
    };
    localStorage.setItem(key, JSON.stringify(entry));
  } catch (e) {
    console.warn('Failed to cache hotel data:', e);
  }
}

// Mock hotel data for fallback
function generateMockHotels(
  destination: string,
  nights: number
): HotelOption[] {
  const basePrice3Star = 80 + Math.random() * 40;
  const basePrice4Star = 150 + Math.random() * 50;
  const basePrice5Star = 280 + Math.random() * 100;
  
  return [
    {
      id: `mock-3star-${destination}`,
      name: 'City Center Hotel',
      pricePerNight: Math.round(basePrice3Star),
      totalPrice: Math.round(basePrice3Star * nights),
      rating: 3.8,
      reviewCount: 342,
      tier: '3-star',
      amenities: ['WiFi', 'Air Conditioning', 'Breakfast'],
      imageUrl: 'https://placehold.co/400x300',
      bookingUrl: `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(destination)}`,
      location: destination,
    },
    {
      id: `mock-4star-${destination}`,
      name: 'Premium Boutique Hotel',
      pricePerNight: Math.round(basePrice4Star),
      totalPrice: Math.round(basePrice4Star * nights),
      rating: 4.3,
      reviewCount: 856,
      tier: '4-star',
      amenities: ['WiFi', 'Pool', 'Gym', 'Spa', 'Restaurant'],
      imageUrl: 'https://placehold.co/400x300',
      bookingUrl: `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(destination)}`,
      location: destination,
    },
    {
      id: `mock-5star-${destination}`,
      name: 'Luxury Grand Resort',
      pricePerNight: Math.round(basePrice5Star),
      totalPrice: Math.round(basePrice5Star * nights),
      rating: 4.8,
      reviewCount: 1245,
      tier: '5-star',
      amenities: ['WiFi', 'Pool', 'Spa', 'Fine Dining', 'Concierge', 'Rooftop Bar'],
      imageUrl: 'https://placehold.co/400x300',
      bookingUrl: `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(destination)}`,
      location: destination,
    },
  ];
}

function calculateNights(checkIn: string, checkOut: string): number {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  return Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
}

/**
 * Fetch hotel options from SerpAPI via edge function
 */
export async function fetchHotelOptions(
  params: HotelSearchParams
): Promise<HotelSearchResult> {
  const { destination, checkIn, checkOut, adults = 2 } = params;
  const nights = calculateNights(checkIn, checkOut);
  
  // Check cache first
  const cacheKey = getCacheKey(params);
  const cached = getFromCache(cacheKey);
  if (cached) {
    return cached;
  }
  
  // Check if we should use mock data
  if (shouldUseMockData()) {
    console.log(`Using mock hotel data for ${destination} (API calls disabled)`);
    const mockResult: HotelSearchResult = {
      destination,
      options: generateMockHotels(destination, nights),
      searchUrl: `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(destination)}`,
      searchDate: new Date().toISOString(),
      useMock: true,
    };
    setCache(cacheKey, mockResult);
    return mockResult;
  }
  
  try {
    console.log(`Fetching hotels in: ${destination}`);
    
    const { data, error } = await supabase.functions.invoke('search-hotels', {
      body: {
        destination,
        checkIn,
        checkOut,
        adults,
      },
    });
    
    if (error) {
      console.error('Edge function error:', error);
      throw new Error(error.message);
    }
    
    if (data.useMock || data.error || !data.options?.length) {
      console.warn('Using mock hotel data:', data.error);
      const mockResult: HotelSearchResult = {
        destination,
        options: generateMockHotels(destination, nights),
        searchUrl: `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(destination)}`,
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
    console.error('Hotel search failed:', error);
    
    // Return mock data on failure
    const mockResult: HotelSearchResult = {
      destination,
      options: generateMockHotels(destination, nights),
      searchUrl: `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(destination)}`,
      searchDate: new Date().toISOString(),
      useMock: true,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    
    return mockResult;
  }
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
  console.log('Hotel cache cleared');
}
