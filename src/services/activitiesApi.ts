import { supabase } from '@/integrations/supabase/client';

export interface ActivityPOI {
  name: string;
  address: string;
  rating: number | null;
  reviews: number | null;
  type: string;
  priceLevel: number;
  priceLabel: string | null;
  estimatedCost: number;
  thumbnail: string | null;
  coordinates: { lat: number; lng: number } | null;
  mapsUrl: string;
  description: string | null;
  website: string | null;
}

export interface ActivitySearchResult {
  destination: string;
  category: 'attractions' | 'restaurants' | 'museums';
  results: ActivityPOI[];
  totalFound: number;
}

const CACHE_DURATION_MS = 30 * 60 * 1000;
const CACHE_PREFIX = 'activity_search_';

function cacheKey(dest: string, cat: string) {
  return `${CACHE_PREFIX}${dest.toLowerCase()}_${cat}`;
}
function getCache(k: string): ActivitySearchResult | null {
  try {
    const raw = localStorage.getItem(k);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts < CACHE_DURATION_MS) return data;
    localStorage.removeItem(k);
    return null;
  } catch { return null; }
}
function setCache(k: string, data: ActivitySearchResult) {
  try { localStorage.setItem(k, JSON.stringify({ data, ts: Date.now() })); } catch {}
}

export async function fetchActivities(
  destination: string,
  category: 'attractions' | 'restaurants' | 'museums' = 'attractions',
  limit = 10
): Promise<ActivitySearchResult> {
  const key = cacheKey(destination, category);
  const cached = getCache(key);
  if (cached) return cached;

  const { data, error } = await supabase.functions.invoke('search-activities', {
    body: { destination, category, limit },
  });
  if (error) throw new Error(`Activity search failed: ${error.message}`);
  if (data?.ok === false) throw new Error(data.error || 'Activity search error');

  const result: ActivitySearchResult = {
    destination,
    category,
    results: data.results || [],
    totalFound: data.totalFound || 0,
  };
  setCache(key, result);
  return result;
}

export async function fetchDestinationPOIs(destination: string) {
  const [attractions, restaurants, museums] = await Promise.allSettled([
    fetchActivities(destination, 'attractions', 10),
    fetchActivities(destination, 'restaurants', 10),
    fetchActivities(destination, 'museums', 6),
  ]);
  return {
    attractions: attractions.status === 'fulfilled' ? attractions.value.results : [],
    restaurants: restaurants.status === 'fulfilled' ? restaurants.value.results : [],
    museums: museums.status === 'fulfilled' ? museums.value.results : [],
  };
}

export function clearActivityCache() {
  Object.keys(localStorage).forEach((k) => {
    if (k.startsWith(CACHE_PREFIX)) localStorage.removeItem(k);
  });
}
