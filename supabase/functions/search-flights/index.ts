import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FlightSearchParams {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate: string;
  adults?: number;
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
  type?: string;
}

interface SerpApiResponse {
  best_flights?: SerpApiFlight[];
  other_flights?: SerpApiFlight[];
  search_metadata?: {
    google_flights_url?: string;
  };
  error?: string;
}

interface FlightOption {
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

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

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

function transformFlight(
  flight: SerpApiFlight,
  searchUrl: string,
  tier: 'budget' | 'mid' | 'premium'
): FlightOption {
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
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const serpApiKey = Deno.env.get('SERPAPI_KEY');
    
    if (!serpApiKey) {
      console.error('SERPAPI_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'API key not configured', useMock: true }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const params: FlightSearchParams = await req.json();
    const { origin, destination, departureDate, returnDate, adults = 1 } = params;

    console.log(`Searching flights: ${origin} → ${destination} on ${departureDate}`);

    // Build SerpAPI request URL
    const searchParams = new URLSearchParams({
      engine: 'google_flights',
      api_key: serpApiKey,
      departure_id: origin,
      arrival_id: destination,
      outbound_date: departureDate,
      return_date: returnDate,
      adults: adults.toString(),
      currency: 'USD',
      hl: 'en',
      type: '1', // Round trip
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
      console.error('SerpAPI returned error:', data.error);
      return new Response(
        JSON.stringify({ error: data.error, useMock: true }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Combine and sort flights by price
    const allFlights = [
      ...(data.best_flights || []),
      ...(data.other_flights || []),
    ].sort((a, b) => a.price - b.price);

    if (allFlights.length === 0) {
      console.log('No flights found');
      return new Response(
        JSON.stringify({
          origin,
          destination,
          options: [],
          searchUrl: data.search_metadata?.google_flights_url || '',
          searchDate: new Date().toISOString(),
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const searchUrl = data.search_metadata?.google_flights_url || 
      `https://www.google.com/travel/flights?q=flights+from+${origin}+to+${destination}`;

    // Select 3 representative flights: budget, mid, premium
    let selectedFlights: FlightOption[] = [];
    
    if (allFlights.length <= 3) {
      selectedFlights = allFlights.map((f, i) => 
        transformFlight(f, searchUrl, categorizeTier(allFlights, i))
      );
    } else {
      // Pick budget (cheapest), mid (middle), premium (direct or fastest)
      const budgetFlight = allFlights[0];
      const midIndex = Math.floor(allFlights.length / 2);
      const midFlight = allFlights[midIndex];
      
      // Find direct/fastest for premium
      const directFlight = allFlights.find(f => f.flights.length === 1);
      const premiumFlight = directFlight || allFlights[allFlights.length - 1];
      
      selectedFlights = [
        transformFlight(budgetFlight, searchUrl, 'budget'),
        transformFlight(midFlight, searchUrl, 'mid'),
        transformFlight(premiumFlight, searchUrl, 'premium'),
      ];
      
      // Dedupe by price
      const seenPrices = new Set<number>();
      selectedFlights = selectedFlights.filter(f => {
        if (seenPrices.has(f.price)) return false;
        seenPrices.add(f.price);
        return true;
      });
    }

    console.log(`Found ${selectedFlights.length} flight options`);

    const result = {
      origin,
      destination,
      options: selectedFlights,
      searchUrl,
      searchDate: new Date().toISOString(),
      totalFound: allFlights.length,
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Flight search error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage, useMock: true }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
