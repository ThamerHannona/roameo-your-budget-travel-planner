import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { z } from "https://esm.sh/zod@3.23.8";

// Input validation schema
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const isValidFutureDate = (date: string) => {
  if (!DATE_REGEX.test(date)) return false;
  const d = new Date(date);
  if (isNaN(d.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const maxDate = new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000);
  return d >= today && d <= maxDate;
};

const HotelSearchSchema = z.object({
  q: z.string().trim().min(2, 'q must be at least 2 characters').max(100, 'q must be at most 100 characters')
    .regex(/^[\p{L}0-9\s,.\-'()]+$/u, 'q contains invalid characters'),
  checkIn: z.string().refine(isValidFutureDate, 'checkIn must be YYYY-MM-DD within the next 2 years'),
  checkOut: z.string().refine(isValidFutureDate, 'checkOut must be YYYY-MM-DD within the next 2 years'),
  adults: z.number().int().min(1).max(10).default(2),
  rooms: z.number().int().min(1).max(10).default(1),
  currency: z.string().regex(/^[A-Z]{3}$/, 'currency must be a 3-letter ISO code').default('USD'),
  gl: z.string().regex(/^[a-z]{2}$/, 'gl must be a 2-letter country code').default('us'),
  hl: z.string().regex(/^[a-z]{2}$/, 'hl must be a 2-letter language code').default('en'),
}).refine(
  (d) => new Date(d.checkOut) > new Date(d.checkIn),
  { message: 'checkOut must be after checkIn' }
);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting
const RATE_LIMITS = {
  anonymous: { maxRequests: 5, windowMs: 60 * 60 * 1000 },
  authenticated: { maxRequests: 20, windowMs: 60 * 60 * 1000 },
};

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
    rateLimitStore.set(identifier, { count: 1, resetTime: now + limits.windowMs });
    return { allowed: true };
  }
  if (record.count >= limits.maxRequests) {
    return { allowed: false, retryAfter: Math.ceil((record.resetTime - now) / 1000) };
  }
  record.count++;
  return { allowed: true };
}

function cleanupRateLimitStore(): void {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetTime) rateLimitStore.delete(key);
  }
}

interface SerpApiHotel {
  name: string;
  description?: string;
  link?: string;
  rate_per_night?: { lowest?: string; extracted_lowest?: number };
  total_rate?: { lowest?: string; extracted_lowest?: number };
  overall_rating?: number;
  reviews?: number;
  type?: string;
  amenities?: string[];
  images?: Array<{ thumbnail?: string; original_image?: string }>;
  gps_coordinates?: { latitude: number; longitude: number };
}

function jsonRes(body: Record<string, unknown>, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  cleanupRateLimitStore();

  try {
    // Rate limit check
    const userId = await getUserIdFromAuth(req);
    const isAuthenticated = !!userId;
    const identifier = userId || getClientIP(req);
    const rl = checkRateLimit(identifier, isAuthenticated);
    if (!rl.allowed) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Rate limit exceeded', retryAfter: rl.retryAfter }),
        {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Retry-After': String(rl.retryAfter || 3600) },
        }
      );
    }

    const serpApiKey = Deno.env.get('SERPAPI_KEY');
    if (!serpApiKey) {
      return jsonRes({ ok: false, error: 'SERPAPI_KEY not configured' }, 500);
    }

    // Parse params from GET query string or POST body
    let q: string | null = null;
    let checkIn: string | null = null;
    let checkOut: string | null = null;
    let adults = 2;
    let rooms = 1;
    let currency = 'USD';
    let gl = 'us';
    let hl = 'en';

    if (req.method === 'GET') {
      const url = new URL(req.url);
      q = url.searchParams.get('q');
      checkIn = url.searchParams.get('checkIn');
      checkOut = url.searchParams.get('checkOut');
      adults = parseInt(url.searchParams.get('adults') || '2') || 2;
      rooms = parseInt(url.searchParams.get('rooms') || '1') || 1;
      currency = url.searchParams.get('currency') || 'USD';
      gl = url.searchParams.get('gl') || 'us';
      hl = url.searchParams.get('hl') || 'en';
    } else if (req.method === 'POST') {
      const body = await req.json();
      // Support both old format (destination) and new format (q)
      q = body.q || body.destination || null;
      checkIn = body.checkIn || body.check_in_date || null;
      checkOut = body.checkOut || body.check_out_date || null;
      adults = body.adults || 2;
      rooms = body.rooms || 1;
      currency = body.currency || 'USD';
      gl = body.gl || 'us';
      hl = body.hl || 'en';
    } else {
      return jsonRes({ ok: false, error: 'Method not allowed' }, 405);
    }

    // Validate required params
    if (!q || !checkIn || !checkOut) {
      return jsonRes({ ok: false, error: 'Missing required parameters: q, checkIn, checkOut' }, 400);
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(checkIn) || !dateRegex.test(checkOut)) {
      return jsonRes({ ok: false, error: 'Dates must be in YYYY-MM-DD format' }, 400);
    }

    const nights = Math.max(1, Math.ceil(
      (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)
    ));

    console.log(`Searching hotels: q="${q}" checkIn=${checkIn} checkOut=${checkOut} adults=${adults} rooms=${rooms}`);

    // Build SerpAPI request
    const searchParams = new URLSearchParams({
      engine: 'google_hotels',
      api_key: serpApiKey,
      q: q.startsWith('hotels in') ? q : `hotels in ${q}`,
      check_in_date: checkIn,
      check_out_date: checkOut,
      adults: adults.toString(),
      rooms: rooms.toString(),
      currency,
      hl,
      gl,
    });

    const apiUrl = `https://serpapi.com/search.json?${searchParams}`;
    console.log('Calling SerpAPI:', apiUrl.replace(serpApiKey, 'REDACTED'));

    const response = await fetch(apiUrl);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('SerpAPI error:', response.status, errorText);
      const status = response.status === 429 ? 429 : response.status >= 500 ? 502 : 422;
      return jsonRes({ ok: false, error: `SerpAPI error: ${response.status}`, debug: errorText }, status);
    }

    const data = await response.json();

    if (data.error) {
      console.error('SerpAPI returned error:', data.error);
      return jsonRes({ ok: false, error: data.error }, 422);
    }

    const allHotels: SerpApiHotel[] = data.properties || [];

    if (allHotels.length === 0) {
      return jsonRes({
        ok: true,
        results: [],
        searchUrl: data.search_metadata?.google_hotels_url || '',
        totalFound: 0,
      }, 200);
    }

    const searchUrl = data.search_metadata?.google_hotels_url ||
      `https://www.google.com/travel/hotels?q=${encodeURIComponent(q)}`;

    // Normalize results
    const results = allHotels.map((hotel) => {
      const pricePerNight = hotel.rate_per_night?.extracted_lowest ||
        (hotel.total_rate?.extracted_lowest ? Math.round(hotel.total_rate.extracted_lowest / nights) : null);
      const totalPrice = hotel.total_rate?.extracted_lowest ||
        (pricePerNight ? pricePerNight * nights : null);

      return {
        name: hotel.name || 'Unknown Hotel',
        price: pricePerNight ?? totalPrice ?? null,
        currency,
        rate_type: hotel.rate_per_night?.extracted_lowest ? 'night' : (hotel.total_rate?.extracted_lowest ? 'total' : null),
        rating: hotel.overall_rating ?? null,
        reviews: hotel.reviews ?? null,
        address: hotel.type || null,
        thumbnail: hotel.images?.[0]?.thumbnail || hotel.images?.[0]?.original_image || null,
        link: hotel.link || searchUrl,
        amenities: hotel.amenities?.slice(0, 6) || [],
        pricePerNight: pricePerNight ?? null,
        totalPrice: totalPrice ? Math.round(totalPrice) : null,
      };
    });

    console.log(`Found ${results.length} hotel results`);

    return jsonRes({
      ok: true,
      results,
      searchUrl,
      totalFound: allHotels.length,
      nights,
    }, 200);

  } catch (error) {
    console.error('Hotel search error:', error);
    return jsonRes({
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});
