import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { z } from "https://esm.sh/zod@3.23.8";

// Fetches top attractions + restaurants from SerpAPI google_maps engine
// Query examples: "top attractions in Lisbon", "best restaurants in Prague"

const ActivitySearchSchema = z.object({
  destination: z.string().trim().min(2).max(100)
    .regex(/^[\p{L}0-9\s,.\-'()]+$/u, 'destination contains invalid characters'),
  category: z.enum(['attractions', 'restaurants', 'museums']).default('attractions'),
  limit: z.number().int().min(1).max(20).default(10),
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RATE_LIMITS = {
  anonymous: { maxRequests: 10, windowMs: 60 * 60 * 1000 },
  authenticated: { maxRequests: 40, windowMs: 60 * 60 * 1000 },
};
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function getClientIP(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
         req.headers.get('x-real-ip') || 'unknown';
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
  } catch { return null; }
}

function checkRateLimit(id: string, isAuth: boolean) {
  const now = Date.now();
  const limits = isAuth ? RATE_LIMITS.authenticated : RATE_LIMITS.anonymous;
  const rec = rateLimitStore.get(id);
  if (!rec || now > rec.resetTime) {
    rateLimitStore.set(id, { count: 1, resetTime: now + limits.windowMs });
    return { allowed: true };
  }
  if (rec.count >= limits.maxRequests) {
    return { allowed: false, retryAfter: Math.ceil((rec.resetTime - now) / 1000) };
  }
  rec.count++;
  return { allowed: true };
}

function jsonRes(body: Record<string, unknown>, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

interface SerpLocal {
  title?: string;
  place_id?: string;
  data_id?: string;
  rating?: number;
  reviews?: number;
  type?: string;
  types?: string[];
  address?: string;
  price?: string;
  description?: string;
  thumbnail?: string;
  gps_coordinates?: { latitude: number; longitude: number };
  hours?: string;
  operating_hours?: Record<string, string>;
  website?: string;
  phone?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const userId = await getUserIdFromAuth(req);
    const isAuth = !!userId;
    const identifier = userId || getClientIP(req);
    const rl = checkRateLimit(identifier, isAuth);
    if (!rl.allowed) {
      return jsonRes({ ok: false, error: 'Rate limit exceeded', retryAfter: rl.retryAfter }, 429);
    }

    const serpApiKey = Deno.env.get('SERPAPI_KEY');
    if (!serpApiKey) return jsonRes({ ok: false, error: 'SERPAPI_KEY not configured' }, 500);

    let raw: Record<string, unknown> = {};
    if (req.method === 'GET') {
      const url = new URL(req.url);
      raw = {
        destination: url.searchParams.get('destination') ?? undefined,
        category: url.searchParams.get('category') ?? undefined,
        limit: url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit')!, 10) : undefined,
      };
    } else if (req.method === 'POST') {
      try {
        raw = await req.json();
      } catch {
        return jsonRes({ ok: false, error: 'Invalid JSON body' }, 400);
      }
    } else {
      return jsonRes({ ok: false, error: 'Method not allowed' }, 405);
    }
    Object.keys(raw).forEach((k) => raw[k] === undefined && delete raw[k]);

    const parsed = ActivitySearchSchema.safeParse(raw);
    if (!parsed.success) {
      return jsonRes({ ok: false, error: 'Invalid parameters', details: parsed.error.flatten() }, 400);
    }
    const { destination, category, limit } = parsed.data;

    const queryMap = {
      attractions: `top attractions in ${destination}`,
      restaurants: `best restaurants in ${destination}`,
      museums: `museums in ${destination}`,
    };
    const q = queryMap[category];

    const params = new URLSearchParams({
      engine: 'google_maps',
      type: 'search',
      q,
      api_key: serpApiKey,
      hl: 'en',
    });

    const apiUrl = `https://serpapi.com/search.json?${params}`;
    console.log('Activities SerpAPI:', apiUrl.replace(serpApiKey, 'REDACTED'));

    const response = await fetch(apiUrl);
    if (!response.ok) {
      const txt = await response.text();
      console.error('SerpAPI error:', response.status, txt);
      const status = response.status === 429 ? 429 : response.status >= 500 ? 502 : 422;
      return jsonRes({ ok: false, error: `SerpAPI error: ${response.status}`, debug: txt }, status);
    }
    const data = await response.json();
    if (data.error) {
      return jsonRes({ ok: false, error: data.error }, 422);
    }

    const rawResults: SerpLocal[] = data.local_results || [];
    const results = rawResults.slice(0, limit).map((r) => {
      const priceLevel = r.price ? r.price.length : 0; // "$", "$$", "$$$"
      // rough per-person price estimate
      let estimatedCost = 0;
      if (category === 'restaurants') {
        estimatedCost = priceLevel === 0 ? 20 : priceLevel === 1 ? 15 : priceLevel === 2 ? 35 : priceLevel === 3 ? 70 : 120;
      } else if (category === 'attractions' || category === 'museums') {
        // museum/attraction ticket estimates
        estimatedCost = 15;
      }
      const coords = r.gps_coordinates;
      const mapsUrl = r.place_id
        ? `https://www.google.com/maps/place/?q=place_id:${r.place_id}`
        : coords
          ? `https://www.google.com/maps/search/?api=1&query=${coords.latitude},${coords.longitude}`
          : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((r.title || '') + ' ' + destination)}`;
      return {
        name: r.title || 'Unknown',
        address: r.address || destination,
        rating: r.rating ?? null,
        reviews: r.reviews ?? null,
        type: r.type || r.types?.[0] || category,
        priceLevel,
        priceLabel: r.price || null,
        estimatedCost,
        thumbnail: r.thumbnail || null,
        coordinates: coords ? { lat: coords.latitude, lng: coords.longitude } : null,
        mapsUrl,
        description: r.description || null,
        website: r.website || null,
      };
    });

    return jsonRes({
      ok: true,
      results,
      totalFound: rawResults.length,
      category,
      destination,
    }, 200);
  } catch (error) {
    console.error('Activities search error:', error);
    return jsonRes({ ok: false, error: error instanceof Error ? error.message : 'Unknown error' }, 500);
  }
});
