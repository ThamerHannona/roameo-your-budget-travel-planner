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
  hotel_class?: string; // e.g. "4-star hotel"
  extracted_hotel_class?: number; // e.g. 4
  amenities?: string[];
  images?: Array<{ thumbnail?: string; original_image?: string }>;
  gps_coordinates?: { latitude: number; longitude: number };
  nearby_places?: Array<{ name: string; transportations?: Array<{ type: string; duration: string }> }>;
}

function parseStars(h: SerpApiHotel): number | null {
  if (typeof h.extracted_hotel_class === 'number') return h.extracted_hotel_class;
  const m = h.hotel_class?.match(/(\d)/);
  return m ? parseInt(m[1], 10) : null;
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
    let raw: Record<string, unknown>;

    if (req.method === 'GET') {
      const url = new URL(req.url);
      raw = {
        q: url.searchParams.get('q') ?? undefined,
        checkIn: url.searchParams.get('checkIn') ?? undefined,
        checkOut: url.searchParams.get('checkOut') ?? undefined,
        adults: url.searchParams.get('adults') ? parseInt(url.searchParams.get('adults')!, 10) : undefined,
        rooms: url.searchParams.get('rooms') ? parseInt(url.searchParams.get('rooms')!, 10) : undefined,
        currency: url.searchParams.get('currency') ?? undefined,
        gl: url.searchParams.get('gl') ?? undefined,
        hl: url.searchParams.get('hl') ?? undefined,
      };
    } else if (req.method === 'POST') {
      try {
        const body = await req.json();
        raw = {
          q: body.q ?? body.destination,
          checkIn: body.checkIn ?? body.check_in_date,
          checkOut: body.checkOut ?? body.check_out_date,
          adults: body.adults,
          rooms: body.rooms,
          currency: body.currency,
          gl: body.gl,
          hl: body.hl,
        };
      } catch {
        return jsonRes({ ok: false, error: 'Invalid JSON body' }, 400);
      }
    } else {
      return jsonRes({ ok: false, error: 'Method not allowed' }, 405);
    }

    // Strip undefined so schema defaults apply
    Object.keys(raw).forEach((k) => raw[k] === undefined && delete raw[k]);

    const parsed = HotelSearchSchema.safeParse(raw);
    if (!parsed.success) {
      return jsonRes({ ok: false, error: 'Invalid request parameters', details: parsed.error.flatten() }, 400);
    }
    const { q, checkIn, checkOut, adults, rooms, currency, gl, hl } = parsed.data;

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

    let allHotels: SerpApiHotel[] = data.properties || [];

    // Follow next_page_token up to 2 more times to reach ~50 properties.
    const TARGET = 50;
    const MAX_EXTRA_PAGES = 2;
    let nextToken: string | undefined = data.serpapi_pagination?.next_page_token
      || data.pagination?.next_page_token
      || data.next_page_token;
    let pagesFetched = 0;
    while (nextToken && allHotels.length < TARGET && pagesFetched < MAX_EXTRA_PAGES) {
      pagesFetched++;
      try {
        const pageParams = new URLSearchParams(searchParams);
        pageParams.set('next_page_token', nextToken);
        const pageUrl = `https://serpapi.com/search.json?${pageParams}`;
        const pageRes = await fetch(pageUrl);
        if (!pageRes.ok) {
          await pageRes.text();
          break;
        }
        const pageData = await pageRes.json();
        const pageHotels: SerpApiHotel[] = pageData.properties || [];
        if (pageHotels.length === 0) break;
        allHotels = [...allHotels, ...pageHotels];
        console.log(`Fetched hotel page ${pagesFetched + 1}, total: ${allHotels.length}`);
        nextToken = pageData.serpapi_pagination?.next_page_token
          || pageData.pagination?.next_page_token
          || pageData.next_page_token;
      } catch (e) {
        console.warn(`Hotel page ${pagesFetched + 1} fetch failed:`, e);
        break;
      }
    }
    allHotels = allHotels.slice(0, TARGET);


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

    // Normalize results with enriched fields
    const results = allHotels.map((hotel) => {
      const pricePerNight = hotel.rate_per_night?.extracted_lowest ||
        (hotel.total_rate?.extracted_lowest ? Math.round(hotel.total_rate.extracted_lowest / nights) : null);
      const totalPrice = hotel.total_rate?.extracted_lowest ||
        (pricePerNight ? pricePerNight * nights : null);

      const images = (hotel.images || [])
        .map(img => img.thumbnail || img.original_image)
        .filter((u): u is string => !!u)
        .slice(0, 5);
      const stars = parseStars(hotel);
      const nearest = hotel.nearby_places?.[0];
      const distance = nearest
        ? `${nearest.name}${nearest.transportations?.[0]?.duration ? ` · ${nearest.transportations[0].duration}` : ''}`
        : null;

      return {
        name: hotel.name || 'Unknown Hotel',
        price: pricePerNight ?? totalPrice ?? null,
        currency,
        rate_type: hotel.rate_per_night?.extracted_lowest ? 'night' : (hotel.total_rate?.extracted_lowest ? 'total' : null),
        rating: hotel.overall_rating ?? null,
        reviews: hotel.reviews ?? null,
        stars,
        address: hotel.type || null,
        distance,
        thumbnail: images[0] || null,
        images,
        link: hotel.link || searchUrl,
        amenities: hotel.amenities?.slice(0, 8) || [],
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
