import { supabase } from '@/integrations/supabase/client';

export type StayPropertyType = 'hotel' | 'vacation_rental';

// Types for hotel / vacation-rental data
export interface HotelOption {
  id: string;
  name: string;
  pricePerNight: number;
  totalPrice: number;
  rating: number;
  reviewCount: number;
  stars: number; // 3, 4, 5
  tier: '3-star' | '4-star' | '5-star';
  amenities: string[];
  imageUrl: string;
  images: string[];
  bookingUrl: string;
  location: string;
  distance?: string;
  /** hotel = traditional lodging; vacation_rental = apartments / Airbnb-style stays */
  propertyType: StayPropertyType;
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
  /** When true (default), also pull vacation rentals / apartments for Airbnb-style options */
  includeVacationRentals?: boolean;
  /** Max total stay price (all nights) — budget lodging cap */
  maxPrice?: number;
  /** Max nightly rate */
  maxPricePerNight?: number;
}

// Cache configuration
const CACHE_DURATION_MS = 45 * 60 * 1000;
const CACHE_PREFIX = 'hotel_search_v3_';

interface CacheEntry {
  data: HotelSearchResult;
  timestamp: number;
}

function getCacheKey(params: HotelSearchParams): string {
  const rentals = params.includeVacationRentals === false ? 'hotels' : 'all';
  return `${CACHE_PREFIX}${params.destination}_${params.checkIn}_${params.checkOut}_${params.adults || 2}_${rentals}_${params.maxPrice || 'any'}`;
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

function categorizeTier(stars: number | null, rating: number | null): '3-star' | '4-star' | '5-star' {
  if (stars) {
    if (stars >= 5) return '5-star';
    if (stars >= 4) return '4-star';
    return '3-star';
  }
  if (rating !== null) {
    if (rating >= 4.5) return '5-star';
    if (rating >= 4.0) return '4-star';
    return '3-star';
  }
  return '3-star';
}

function calculateNights(checkIn: string, checkOut: string): number {
  return Math.max(1, Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)));
}

function detectPropertyType(name: string, address?: string | null, forced?: StayPropertyType): StayPropertyType {
  if (forced) return forced;
  const blob = `${name} ${address || ''}`.toLowerCase();
  if (
    /airbnb|vacation rental|apartment|aparthotel|appart|flat |condo|villa|cottage|entire home|private room|guest suite|holiday home|rental/.test(
      blob
    )
  ) {
    return 'vacation_rental';
  }
  return 'hotel';
}

/** Prefer property deep-link; fall back to Google Hotels / Airbnb search for the stay. */
function resolveBookingUrl(
  name: string,
  link: string | undefined,
  searchUrl: string,
  propertyType: StayPropertyType,
  destination: string,
  checkIn: string,
  checkOut: string,
  adults: number
): string {
  if (link && !link.includes('google.com/travel/search') && !link.includes('google.com/travel/hotels')) {
    return link;
  }
  if (propertyType === 'vacation_rental') {
    // Airbnb search with dates so users can book real listings
    const params = new URLSearchParams({
      query: destination,
      checkin: checkIn,
      checkout: checkOut,
      adults: String(adults),
    });
    return `https://www.airbnb.com/s/${encodeURIComponent(destination)}/homes?${params.toString()}`;
  }
  if (link) return link;
  return searchUrl;
}

function mapRawResults(
  rawResults: any[],
  nights: number,
  destination: string,
  searchUrl: string,
  checkIn: string,
  checkOut: string,
  adults: number,
  forcedType?: StayPropertyType,
  idPrefix = 'stay'
): HotelOption[] {
  const withPrices = rawResults.filter((r) => r.pricePerNight || r.totalPrice || r.price);
  withPrices.sort(
    (a, b) => (a.pricePerNight || a.price || 0) - (b.pricePerNight || b.price || 0)
  );

  return withPrices.map((r, idx) => {
    const pricePerNight = r.pricePerNight || r.price || 0;
    const totalPrice = r.totalPrice || pricePerNight * nights;
    const stars: number = typeof r.stars === 'number' ? r.stars : 0;
    const propertyType = detectPropertyType(r.name || '', r.address, forcedType);
    const name = r.name || 'Unnamed stay';
    return {
      id: `${idPrefix}-${idx}-${name.slice(0, 20)}`,
      name,
      pricePerNight: Math.round(pricePerNight),
      totalPrice: Math.round(totalPrice),
      rating: r.rating || 0,
      reviewCount: r.reviews || 0,
      stars: stars || (r.rating >= 4.5 ? 5 : r.rating >= 4.0 ? 4 : 3),
      tier: categorizeTier(stars, r.rating),
      amenities: r.amenities || [],
      imageUrl: r.thumbnail || (r.images?.[0] ?? 'https://placehold.co/400x300'),
      images: r.images || [],
      bookingUrl: resolveBookingUrl(
        name,
        r.link,
        searchUrl,
        propertyType,
        destination,
        checkIn,
        checkOut,
        adults
      ),
      location: destination,
      distance: r.distance || undefined,
      propertyType,
    };
  });
}

async function invokeStaySearch(
  query: string,
  checkIn: string,
  checkOut: string,
  adults: number,
  opts: {
    maxPrice?: number;
    maxPricePerNight?: number;
    vacationRentals?: boolean;
    limit?: number;
  } = {}
): Promise<{ results: any[]; searchUrl: string; totalFound: number }> {
  const { data, error } = await supabase.functions.invoke('search-hotels', {
    body: {
      q: query,
      destination: query,
      checkIn,
      checkOut,
      adults,
      sortByPrice: true,
      maxPrice: opts.maxPrice,
      maxPricePerNight: opts.maxPricePerNight,
      vacationRentals: opts.vacationRentals ?? false,
      limit: opts.limit ?? 80,
    },
  });

  if (error) {
    throw new Error(`Stay search failed: ${error.message}`);
  }
  if (data?.ok === false) {
    throw new Error(data.error || 'Stay search returned an error');
  }

  return {
    results: data?.results || [],
    searchUrl:
      data?.searchUrl ||
      `https://www.google.com/travel/hotels?q=${encodeURIComponent(query)}`,
    totalFound: data?.totalFound || (data?.results || []).length,
  };
}

/**
 * Fetch hotels + vacation rentals via SerpAPI — budget-first (cheapest first, more inventory).
 * NO mock fallback. Filters/sort applied client-side as a second pass.
 */
export async function fetchHotelOptions(
  params: HotelSearchParams
): Promise<HotelSearchResult> {
  const {
    destination,
    checkIn,
    checkOut,
    adults = 2,
    includeVacationRentals = true,
    maxPrice,
    maxPricePerNight,
  } = params;
  const nights = calculateNights(checkIn, checkOut);

  // Derive nightly cap from total lodging budget when not provided
  const derivedNightly =
    maxPricePerNight ??
    (typeof maxPrice === 'number' ? Math.max(1, Math.ceil(maxPrice / nights)) : undefined);

  const cacheKey = getCacheKey(params);
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  if (import.meta.env.DEV) {
    console.log(
      `Fetching cheapest stays in: ${destination} (rentals=${includeVacationRentals}, maxTotal=${maxPrice ?? '—'}, max/night=${derivedNightly ?? '—'})`
    );
  }

  const hotelQuery = `hotels in ${destination}`;
  const rentalQuery = `vacation rentals apartments in ${destination}`;

  const budgetOpts = {
    maxPrice,
    maxPricePerNight: derivedNightly,
    limit: 80,
  };

  // Without a tight budget, also pull a wider unfiltered cheap-sorted list so
  // users see maximum inventory — then filter client-side.
  const hotelPromise = invokeStaySearch(hotelQuery, checkIn, checkOut, adults, {
    ...budgetOpts,
    vacationRentals: false,
  });
  const rentalPromise = includeVacationRentals
    ? invokeStaySearch(rentalQuery, checkIn, checkOut, adults, {
        ...budgetOpts,
        vacationRentals: true,
      }).catch((err) => {
        if (import.meta.env.DEV) console.warn('Vacation rental search failed:', err);
        return { results: [] as any[], searchUrl: '', totalFound: 0 };
      })
    : Promise.resolve({ results: [] as any[], searchUrl: '', totalFound: 0 });

  // Parallel unfiltered cheap-sorted pass (more options if max_price was too tight)
  const wideHotelPromise =
    typeof maxPrice === 'number'
      ? invokeStaySearch(hotelQuery, checkIn, checkOut, adults, {
          vacationRentals: false,
          limit: 60,
        }).catch(() => ({ results: [] as any[], searchUrl: '', totalFound: 0 }))
      : Promise.resolve({ results: [] as any[], searchUrl: '', totalFound: 0 });

  const [hotelData, rentalData, wideHotelData] = await Promise.all([
    hotelPromise,
    rentalPromise,
    wideHotelPromise,
  ]);

  const hotelOptions = mapRawResults(
    [...hotelData.results, ...wideHotelData.results],
    nights,
    destination,
    hotelData.searchUrl || wideHotelData.searchUrl,
    checkIn,
    checkOut,
    adults,
    undefined,
    'hotel'
  );
  const rentalOptions = mapRawResults(
    rentalData.results,
    nights,
    destination,
    rentalData.searchUrl || hotelData.searchUrl,
    checkIn,
    checkOut,
    adults,
    'vacation_rental',
    'rental'
  );

  // Deduplicate by name; keep cheapest instance of each property
  const byName = new Map<string, HotelOption>();
  for (const opt of [...hotelOptions, ...rentalOptions]) {
    const key = opt.name.trim().toLowerCase();
    const existing = byName.get(key);
    if (!existing || opt.totalPrice < existing.totalPrice) {
      byName.set(key, opt);
    }
  }

  let options = Array.from(byName.values());

  // Soft budget filter: keep all, but put in-budget first; hard-filter only if many fit
  options.sort((a, b) => a.pricePerNight - b.pricePerNight || a.totalPrice - b.totalPrice);

  if (typeof maxPrice === 'number' && maxPrice > 0) {
    const inBudget = options.filter((o) => o.totalPrice <= maxPrice);
    // Prefer in-budget options first, then slightly over for transparency
    const over = options.filter((o) => o.totalPrice > maxPrice);
    options = [...inBudget, ...over];
  }

  const airbnbUrl = `https://www.airbnb.com/s/${encodeURIComponent(destination)}/homes?checkin=${checkIn}&checkout=${checkOut}&adults=${adults}`;

  const result: HotelSearchResult = {
    destination,
    options,
    searchUrl: hotelData.searchUrl || airbnbUrl,
    searchDate: new Date().toISOString(),
    totalFound: options.length,
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
