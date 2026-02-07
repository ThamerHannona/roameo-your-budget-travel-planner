import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting configuration
const RATE_LIMITS = {
  anonymous: { maxRequests: 5, windowMs: 60 * 60 * 1000 }, // 5 per hour
  authenticated: { maxRequests: 20, windowMs: 60 * 60 * 1000 }, // 20 per hour
};

// In-memory rate limit store (resets on cold start, but provides protection during active use)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function getClientIP(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
         req.headers.get('x-real-ip') ||
         'unknown';
}

async function getUserIdFromAuth(req: Request): Promise<string | null> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );
    
    const token = authHeader.replace('Bearer ', '');
    const { data, error } = await supabase.auth.getUser(token);
    
    if (error || !data?.user) return null;
    return data.user.id;
  } catch {
    return null;
  }
}

function checkRateLimit(identifier: string, isAuthenticated: boolean): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const limits = isAuthenticated ? RATE_LIMITS.authenticated : RATE_LIMITS.anonymous;
  
  const record = rateLimitStore.get(identifier);
  
  if (!record || now > record.resetTime) {
    // New window or expired - reset counter
    rateLimitStore.set(identifier, { count: 1, resetTime: now + limits.windowMs });
    return { allowed: true };
  }
  
  if (record.count >= limits.maxRequests) {
    // Rate limited
    const retryAfter = Math.ceil((record.resetTime - now) / 1000);
    return { allowed: false, retryAfter };
  }
  
  // Increment counter
  record.count++;
  return { allowed: true };
}

// Clean up old entries periodically (runs on each request, but only cleans if needed)
function cleanupRateLimitStore(): void {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

interface HotelSearchParams {
  destination: string;
  checkIn: string;
  checkOut: string;
  adults?: number;
}

interface SerpApiHotel {
  name: string;
  description?: string;
  link?: string;
  rate_per_night?: {
    lowest?: string;
    extracted_lowest?: number;
  };
  total_rate?: {
    lowest?: string;
    extracted_lowest?: number;
  };
  overall_rating?: number;
  reviews?: number;
  type?: string;
  amenities?: string[];
  images?: Array<{ thumbnail?: string; original_image?: string }>;
  gps_coordinates?: { latitude: number; longitude: number };
}

interface SerpApiResponse {
  properties?: SerpApiHotel[];
  search_metadata?: {
    google_hotels_url?: string;
  };
  error?: string;
}

interface HotelOption {
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

function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

function categorizeTier(rating: number): '3-star' | '4-star' | '5-star' {
  if (rating >= 4.5) return '5-star';
  if (rating >= 4.0) return '4-star';
  return '3-star';
}

function transformHotel(
  hotel: SerpApiHotel,
  nights: number,
  searchUrl: string,
  destination: string
): HotelOption {
  const pricePerNight = hotel.rate_per_night?.extracted_lowest || 
    (hotel.total_rate?.extracted_lowest ? Math.round(hotel.total_rate.extracted_lowest / nights) : 150);
  
  const totalPrice = hotel.total_rate?.extracted_lowest || pricePerNight * nights;
  const rating = hotel.overall_rating || 4.0;
  
  return {
    id: generateId(),
    name: hotel.name || 'Hotel',
    pricePerNight,
    totalPrice: Math.round(totalPrice),
    rating,
    reviewCount: hotel.reviews || Math.floor(Math.random() * 500) + 100,
    tier: categorizeTier(rating),
    amenities: hotel.amenities?.slice(0, 5) || ['WiFi', 'Parking'],
    imageUrl: hotel.images?.[0]?.thumbnail || hotel.images?.[0]?.original_image || 'https://placehold.co/400x300',
    bookingUrl: hotel.link || searchUrl,
    location: destination,
  };
}

function calculateNights(checkIn: string, checkOut: string): number {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  return Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Clean up expired rate limit entries periodically
  cleanupRateLimitStore();

  try {
    // Check rate limiting
    const userId = await getUserIdFromAuth(req);
    const isAuthenticated = !!userId;
    const identifier = userId || getClientIP(req);
    
    const rateLimitResult = checkRateLimit(identifier, isAuthenticated);
    
    if (!rateLimitResult.allowed) {
      console.log(`Rate limited: ${identifier} (authenticated: ${isAuthenticated})`);
      return new Response(
        JSON.stringify({ 
          error: 'Rate limit exceeded', 
          retryAfter: rateLimitResult.retryAfter,
          useMock: true 
        }),
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'Retry-After': String(rateLimitResult.retryAfter || 3600)
          } 
        }
      );
    }
    
    console.log(`Request allowed for: ${identifier} (authenticated: ${isAuthenticated})`);

    const serpApiKey = Deno.env.get('SERPAPI_KEY');
    
    if (!serpApiKey) {
      console.error('SERPAPI_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'API key not configured', useMock: true }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const params: HotelSearchParams = await req.json();
    const { destination, checkIn, checkOut, adults = 2 } = params;
    const nights = calculateNights(checkIn, checkOut);

    console.log(`Searching hotels in ${destination} for ${nights} nights`);

    // Build SerpAPI request URL for Google Hotels
    const searchParams = new URLSearchParams({
      engine: 'google_hotels',
      api_key: serpApiKey,
      q: `hotels in ${destination}`,
      check_in_date: checkIn,
      check_out_date: checkOut,
      adults: adults.toString(),
      currency: 'USD',
      hl: 'en',
      gl: 'us',
    });

    const apiUrl = `https://serpapi.com/search.json?${searchParams}`;
    console.log('Calling SerpAPI:', apiUrl.replace(serpApiKey, 'REDACTED'));

    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('SerpAPI error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: `SerpAPI error: ${response.status}`, useMock: true }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data: SerpApiResponse = await response.json();
    
    if (data.error) {
      console.log('SerpAPI returned error:', data.error);
      return new Response(
        JSON.stringify({ 
          destination, 
          options: [], 
          searchUrl: `https://www.google.com/travel/hotels?q=hotels+in+${encodeURIComponent(destination)}`,
          searchDate: new Date().toISOString(),
          useMock: true,
          error: data.error 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const allHotels = data.properties || [];

    if (allHotels.length === 0) {
      console.log('No hotels found');
      return new Response(
        JSON.stringify({
          destination,
          options: [],
          searchUrl: data.search_metadata?.google_hotels_url || '',
          searchDate: new Date().toISOString(),
          useMock: true,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const searchUrl = data.search_metadata?.google_hotels_url || 
      `https://www.google.com/travel/hotels?q=hotels+in+${encodeURIComponent(destination)}`;

    // Sort by price and pick representative hotels for each tier
    const sortedHotels = allHotels
      .filter(h => h.rate_per_night?.extracted_lowest || h.total_rate?.extracted_lowest)
      .sort((a, b) => {
        const priceA = a.rate_per_night?.extracted_lowest || 0;
        const priceB = b.rate_per_night?.extracted_lowest || 0;
        return priceA - priceB;
      });

    let selectedHotels: HotelOption[] = [];

    if (sortedHotels.length === 0) {
      // Use mock fallback if no prices found
      return new Response(
        JSON.stringify({
          destination,
          options: [],
          searchUrl,
          searchDate: new Date().toISOString(),
          useMock: true,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (sortedHotels.length <= 3) {
      selectedHotels = sortedHotels.map(h => transformHotel(h, nights, searchUrl, destination));
    } else {
      // Pick budget (cheapest), mid (middle), premium (highest rated)
      const budgetHotel = sortedHotels[0];
      const midIndex = Math.floor(sortedHotels.length / 2);
      const midHotel = sortedHotels[midIndex];
      
      // Find highest rated for premium
      const premiumHotel = [...sortedHotels].sort((a, b) => 
        (b.overall_rating || 0) - (a.overall_rating || 0)
      )[0];
      
      selectedHotels = [
        { ...transformHotel(budgetHotel, nights, searchUrl, destination), tier: '3-star' as const },
        { ...transformHotel(midHotel, nights, searchUrl, destination), tier: '4-star' as const },
        { ...transformHotel(premiumHotel, nights, searchUrl, destination), tier: '5-star' as const },
      ];
      
      // Dedupe by name
      const seenNames = new Set<string>();
      selectedHotels = selectedHotels.filter(h => {
        if (seenNames.has(h.name)) return false;
        seenNames.add(h.name);
        return true;
      });
    }

    console.log(`Found ${selectedHotels.length} hotel options`);

    const result = {
      destination,
      options: selectedHotels,
      searchUrl,
      searchDate: new Date().toISOString(),
      totalFound: allHotels.length,
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Hotel search error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage, useMock: true }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
