import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { z } from "https://esm.sh/zod@3.23.8";

// Input validation schemas
const IATA_REGEX = /^[A-Z]{3}$/;
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
  origin: z.string().trim().toUpperCase().regex(IATA_REGEX, 'origin must be a 3-letter IATA code'),
  destination: z.string().trim().toUpperCase().regex(IATA_REGEX, 'destination must be a 3-letter IATA code'),
  departureDate: z.string().refine(isValidFutureDate, 'departDate must be YYYY-MM-DD within the next year'),
  returnDate: z.string().refine(isValidFutureDate, 'returnDate must be YYYY-MM-DD within the next year').optional(),
  adults: z.number().int().min(1).max(9).default(1),
  cabin: z.enum(CABIN_VALUES).default('economy'),
}).refine(
  (d) => !d.returnDate || new Date(d.returnDate) >= new Date(d.departureDate),
  { message: 'returnDate must be on or after departureDate' }
).refine(
  (d) => d.origin !== d.destination,
  { message: 'origin and destination must differ' }
);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Rate limiting configuration
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
    layovers: flight.flights.length - 1,
    layoverCities,
    layoverDuration: totalLayoverMinutes > 0 ? formatDuration(totalLayoverMinutes) : '',
    bookingUrl: searchUrl,
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
    let origin: string, destination: string, departureDate: string;
    let returnDate: string | undefined;
    let adults = 1;
    let cabin = 'economy';
    let isGetRequest = false;

    if (req.method === 'GET') {
      isGetRequest = true;
      const url = new URL(req.url);
      origin = url.searchParams.get('origin') || '';
      destination = url.searchParams.get('destination') || '';
      departureDate = url.searchParams.get('departDate') || '';
      returnDate = url.searchParams.get('returnDate') || undefined;
      adults = parseInt(url.searchParams.get('adults') || '1', 10);
      cabin = url.searchParams.get('cabin') || 'economy';
    } else {
      const body = await req.json();
      origin = body.origin || '';
      destination = body.destination || '';
      departureDate = body.departureDate || body.departDate || '';
      returnDate = body.returnDate || undefined;
      adults = body.adults || 1;
      cabin = body.cabin || 'economy';
    }

    if (!origin || !destination || !departureDate) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Missing required parameters: origin, destination, departDate' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Searching flights: ${origin} → ${destination} on ${departureDate}, cabin=${cabin}`);

    // Build SerpAPI request
    const searchParams = new URLSearchParams({
      engine: 'google_flights',
      api_key: serpApiKey,
      departure_id: origin,
      arrival_id: destination,
      outbound_date: departureDate,
      adults: adults.toString(),
      currency: 'USD',
      hl: 'en',
      travel_class: mapCabinToTravelClass(cabin),
    });

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
    const allFlights = [...bestFlights, ...otherFlights].sort((a, b) => a.price - b.price);

    const searchUrl = data.search_metadata?.google_flights_url ||
      `https://www.google.com/travel/flights?q=flights+from+${origin}+to+${destination}`;

    // For GET requests, return normalized format
    if (isGetRequest) {
      const results = normalizeFlights(bestFlights, otherFlights, searchUrl);
      return new Response(
        JSON.stringify({ ok: true, results }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // For POST requests (legacy), return tier-based format
    if (allFlights.length === 0) {
      return new Response(
        JSON.stringify({ ok: true, origin, destination, options: [], searchUrl, searchDate: new Date().toISOString(), totalFound: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let selectedFlights: any[] = [];
    if (allFlights.length <= 3) {
      selectedFlights = allFlights.map((f, i) => transformFlightLegacy(f, searchUrl, categorizeTier(allFlights, i)));
    } else {
      const budgetFlight = allFlights[0];
      const midFlight = allFlights[Math.floor(allFlights.length / 2)];
      const directFlight = allFlights.find(f => f.flights.length === 1);
      const premiumFlight = directFlight || allFlights[allFlights.length - 1];
      selectedFlights = [
        transformFlightLegacy(budgetFlight, searchUrl, 'budget'),
        transformFlightLegacy(midFlight, searchUrl, 'mid'),
        transformFlightLegacy(premiumFlight, searchUrl, 'premium'),
      ];
      const seenPrices = new Set<number>();
      selectedFlights = selectedFlights.filter(f => {
        if (seenPrices.has(f.price)) return false;
        seenPrices.add(f.price);
        return true;
      });
    }

    console.log(`Found ${selectedFlights.length} flight options`);

    return new Response(
      JSON.stringify({ ok: true, origin, destination, options: selectedFlights, searchUrl, searchDate: new Date().toISOString(), totalFound: allFlights.length }),
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
