import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { z } from "https://esm.sh/zod@3.23.8";

// Input validation schemas — allow multi-airport codes (JFK,EWR,LGA)
const IATA_LIST_REGEX = /^[A-Z]{3}(,[A-Z]{3}){0,5}$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const CABIN_VALUES = ['economy', 'premium_economy', 'business', 'first'] as const;

const isValidFutureDate = (date: string) => {
  if (!DATE_REGEX.test(date)) return false;
  const d = new Date(date);
  if (isNaN(d.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const maxDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
  return d >= today && d <= maxDate;
};

const FlightSearchSchema = z.object({
  origin: z.string().trim().toUpperCase().regex(IATA_LIST_REGEX, 'origin must be IATA code(s)'),
  destination: z.string().trim().toUpperCase().regex(IATA_LIST_REGEX, 'destination must be IATA code(s)'),
  departureDate: z.string().refine(isValidFutureDate, 'departDate must be YYYY-MM-DD within the next year'),
  returnDate: z.string().refine(isValidFutureDate, 'returnDate must be YYYY-MM-DD within the next year').optional(),
  adults: z.number().int().min(1).max(9).default(1),
  cabin: z.enum(CABIN_VALUES).default('economy'),
  /** Budget-first: max total ticket price (all passengers) */
  maxPrice: z.number().int().positive().max(100000).optional(),
  /** More results, slower — use for single-destination budget page */
  deepSearch: z.boolean().default(false),
  /** Include "View more flights" hidden results (default true for budget discovery) */
  showHidden: z.boolean().default(true),
}).refine(
  (d) => !d.returnDate || new Date(d.returnDate) >= new Date(d.departureDate),
  { message: 'returnDate must be on or after departureDate' }
).refine(
  (d) => {
    const o = d.origin.split(',')[0];
    const dest = d.destination.split(',')[0];
    return o !== dest;
  },
  { message: 'origin and destination must differ' }
);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const SERPAPI_QUOTA_MESSAGE = 'Live flight pricing is temporarily unavailable because the flight search provider account has run out of searches.';

function isSerpApiQuotaExceeded(status: number, bodyText: string): boolean {
  const normalized = bodyText.toLowerCase();
  return status === 429 && (
    normalized.includes('run out of searches') ||
    normalized.includes('quota') ||
    normalized.includes('exceeded')
  );
}

// Rate limiting — higher for multi-destination budget discovery
const RATE_LIMITS = {
  anonymous: { maxRequests: 40, windowMs: 60 * 60 * 1000 },
  authenticated: { maxRequests: 80, windowMs: 60 * 60 * 1000 },
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
    const retryAfter = Math.ceil((record.resetTime - now) / 1000);
    return { allowed: false, retryAfter };
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

// Map cabin names to SerpAPI travel_class values
function mapCabinToTravelClass(cabin?: string): string {
  switch (cabin?.toLowerCase()) {
    case 'business': return '2';
    case 'first': return '3';
    case 'premium_economy': return '4';
    case 'economy':
    default: return '1';
  }
}

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

interface SerpApiFlightSegment {
  departure_airport: { name: string; id: string; time: string };
  arrival_airport: { name: string; id: string; time: string };
  duration: number;
  airline: string;
  airline_logo: string;
  flight_number: string;
}

interface SerpApiFlight {
  flights: SerpApiFlightSegment[];
  total_duration: number;
  price: number;
  layovers?: Array<{ name: string; duration: number; id: string }>;
  booking_token?: string;
}

interface NormalizedResult {
  price: number;
  airline: string;
  departTime: string;
  arriveTime: string;
  durationMin: number;
  stops: number;
  bookingLink: string;
}

function normalizeFlights(
  bestFlights: SerpApiFlight[],
  otherFlights: SerpApiFlight[],
  searchUrl: string
): NormalizedResult[] {
  const all = [...bestFlights, ...otherFlights];
  return all.map((f) => {
    const first = f.flights[0];
    const last = f.flights[f.flights.length - 1];
    return {
      price: f.price,
      airline: first.airline,
      departTime: first.departure_airport.time,
      arriveTime: last.arrival_airport.time,
      durationMin: f.total_duration,
      stops: f.flights.length - 1,
      bookingLink: searchUrl,
    };
  });
}

// Also keep the legacy tier-based transform for POST callers
function categorizeTier(
  flights: SerpApiFlight[],
  currentIndex: number
): 'budget' | 'mid' | 'premium' {
  if (flights.length <= 1) return 'mid';
  const prices = flights.map(f => f.price).sort((a, b) => a - b);
  const currentPrice = flights[currentIndex].price;
  const priceIndex = prices.indexOf(currentPrice);
  const position = priceIndex / (prices.length - 1);
  if (position <= 0.33) return 'budget';
  if (position <= 0.66) return 'mid';
  return 'premium';
}

function flightFingerprint(flight: SerpApiFlight): string {
  const segs = (flight.flights || []).map(
    (s) => `${s.flight_number}|${s.departure_airport?.id}|${s.departure_airport?.time}`
  );
  return `${flight.price}|${segs.join('>')}`;
}

function transformFlightLegacy(
  flight: SerpApiFlight,
  searchUrl: string,
  tier: 'budget' | 'mid' | 'premium'
) {
  const firstSegment = flight.flights[0];
  const lastSegment = flight.flights[flight.flights.length - 1];
  const layoverCities = flight.layovers?.map(l => l.name) || [];
  const totalLayoverMinutes = flight.layovers?.reduce((sum, l) => sum + l.duration, 0) || 0;
  return {
    id: generateId(),
    price: flight.price,
    airline: firstSegment.airline,
    flightNumber: firstSegment.flight_number,
    departure: {
      time: firstSegment.departure_airport.time,
      airport: firstSegment.departure_airport.id,
      city: firstSegment.departure_airport.name,
    },
    arrival: {
      time: lastSegment.arrival_airport.time,
      airport: lastSegment.arrival_airport.id,
      city: lastSegment.arrival_airport.name,
    },
    duration: formatDuration(flight.total_duration),
    durationMinutes: flight.total_duration,
    layovers: flight.flights.length - 1,
    layoverCities,
    layoverDuration: totalLayoverMinutes > 0 ? formatDuration(totalLayoverMinutes) : '',
    bookingUrl: searchUrl,
    bookingToken: flight.booking_token,
    departureToken: (flight as { departure_token?: string }).departure_token,
    tier,
    airlineLogo: firstSegment.airline_logo,
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  cleanupRateLimitStore();

  try {
    // Rate limiting
    const userId = await getUserIdFromAuth(req);
    const isAuthenticated = !!userId;
    const identifier = userId || getClientIP(req);
    const rateLimitResult = checkRateLimit(identifier, isAuthenticated);
    if (!rateLimitResult.allowed) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Rate limit exceeded', retryAfter: rateLimitResult.retryAfter }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Retry-After': String(rateLimitResult.retryAfter || 3600) } }
      );
    }

    const serpApiKey = Deno.env.get('SERPAPI_KEY');
    if (!serpApiKey) {
      console.error('SERPAPI_KEY not configured');
      return new Response(
        JSON.stringify({ ok: false, error: 'API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Support both GET (query params) and POST (JSON body)
    let isGetRequest = false;
    let raw: Record<string, unknown>;

    if (req.method === 'GET') {
      isGetRequest = true;
      const url = new URL(req.url);
      raw = {
        origin: url.searchParams.get('origin') ?? undefined,
        destination: url.searchParams.get('destination') ?? undefined,
        departureDate: url.searchParams.get('departDate') ?? undefined,
        returnDate: url.searchParams.get('returnDate') ?? undefined,
        adults: url.searchParams.get('adults') ? parseInt(url.searchParams.get('adults')!, 10) : undefined,
        cabin: url.searchParams.get('cabin') ?? undefined,
      };
    } else {
      try {
        const body = await req.json();
        raw = {
          origin: body.origin,
          destination: body.destination,
          departureDate: body.departureDate ?? body.departDate,
          returnDate: body.returnDate,
          adults: body.adults,
          cabin: body.cabin,
          maxPrice: body.maxPrice ?? body.max_price,
          deepSearch: body.deepSearch ?? body.deep_search,
          showHidden: body.showHidden ?? body.show_hidden,
        };
      } catch {
        return new Response(
          JSON.stringify({ ok: false, error: 'Invalid JSON body' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Strip undefined so schema defaults apply
    Object.keys(raw).forEach((k) => raw[k] === undefined && delete raw[k]);

    const parsed = FlightSearchSchema.safeParse(raw);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Invalid request parameters', details: parsed.error.flatten() }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    const { origin, destination, departureDate, returnDate, adults, cabin, maxPrice, deepSearch, showHidden } = parsed.data;

    console.log(
      `Searching flights (budget-first): ${origin} → ${destination} on ${departureDate}, sort=price, show_hidden=${showHidden}, deep=${deepSearch}, maxPrice=${maxPrice ?? 'none'}`
    );

    // Budget-first SerpAPI request: sort by price, expand hidden inventory
    const searchParams = new URLSearchParams({
      engine: 'google_flights',
      api_key: serpApiKey,
      departure_id: origin,
      arrival_id: destination,
      outbound_date: departureDate,
      adults: adults.toString(),
      currency: 'USD',
      hl: 'en',
      gl: 'us',
      travel_class: mapCabinToTravelClass(cabin),
      sort_by: '2', // Price (cheapest first)
      show_hidden: showHidden ? 'true' : 'false',
    });

    if (deepSearch) {
      searchParams.set('deep_search', 'true');
    }
    if (typeof maxPrice === 'number' && maxPrice > 0) {
      searchParams.set('max_price', String(maxPrice));
    }

    if (returnDate) {
      searchParams.set('return_date', returnDate);
      searchParams.set('type', '1'); // Round trip
    } else {
      searchParams.set('type', '2'); // One way
    }

    const apiUrl = `https://serpapi.com/search.json?${searchParams}`;
    console.log('Calling SerpAPI:', apiUrl.replace(serpApiKey, 'REDACTED'));

    const response = await fetch(apiUrl);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('SerpAPI HTTP error:', response.status, errorText);

      if (isSerpApiQuotaExceeded(response.status, errorText)) {
        return new Response(
          JSON.stringify({
            ok: false,
            error: SERPAPI_QUOTA_MESSAGE,
            code: 'SERPAPI_QUOTA_EXCEEDED',
            providerStatus: response.status,
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ ok: false, error: `SerpAPI returned ${response.status}`, debug: errorText }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();

    if (data.error) {
      console.warn('SerpAPI returned error:', data.error);
      // Treat "no results" as empty rather than a hard error
      const noResultsPhrases = ["hasn't returned any results", "no results"];
      const isNoResults = noResultsPhrases.some(p => data.error.toLowerCase().includes(p));
      if (isNoResults) {
        return new Response(
          JSON.stringify({ ok: true, origin, destination, options: [], results: [], searchUrl: '', searchDate: new Date().toISOString(), totalFound: 0 }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      return new Response(
        JSON.stringify({ ok: false, error: data.error }),
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const bestFlights: SerpApiFlight[] = data.best_flights || [];
    const otherFlights: SerpApiFlight[] = data.other_flights || [];

    // Merge + dedupe + sort cheapest first
    const seen = new Set<string>();
    const allFlights: SerpApiFlight[] = [];
    for (const f of [...bestFlights, ...otherFlights]) {
      if (!f?.price || !f?.flights?.length) continue;
      if (typeof maxPrice === 'number' && f.price > maxPrice) continue;
      const fp = flightFingerprint(f);
      if (seen.has(fp)) continue;
      seen.add(fp);
      allFlights.push(f);
    }
    allFlights.sort((a, b) => a.price - b.price);

    const searchUrl = data.search_metadata?.google_flights_url ||
      `https://www.google.com/travel/flights?q=flights+from+${origin}+to+${destination}`;

    const priceInsights = data.price_insights
      ? {
          lowestPrice: data.price_insights.lowest_price,
          priceLevel: data.price_insights.price_level,
          typicalRange: data.price_insights.typical_price_range,
        }
      : undefined;

    // For GET requests, return normalized format
    if (isGetRequest) {
      const results = normalizeFlights(allFlights, [], searchUrl);
      return new Response(
        JSON.stringify({ ok: true, results, priceInsights }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // For POST requests, return the FULL list sorted by price (budget-first).
    if (allFlights.length === 0) {
      return new Response(
        JSON.stringify({
          ok: true,
          origin,
          destination,
          options: [],
          searchUrl,
          searchDate: new Date().toISOString(),
          totalFound: 0,
          priceInsights,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const options = allFlights.map((f, i) => transformFlightLegacy(f, searchUrl, categorizeTier(allFlights, i)));

    console.log(`Returning ${options.length} flight options sorted by price (cheapest $${options[0]?.price})`);

    return new Response(
      JSON.stringify({
        ok: true,
        origin,
        destination,
        options,
        searchUrl,
        searchDate: new Date().toISOString(),
        totalFound: allFlights.length,
        cheapestPrice: options[0]?.price,
        priceInsights,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );


  } catch (error) {
    console.error('Flight search error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ ok: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
