import { useMemo, useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Building2, Check, ArrowUpRight, Star, MapPin, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { HotelTier } from '@/types/budgetConstraints';

interface HotelPickerProps {
  tiers: HotelTier[];
  selectedPrice: number;
  onSelect: (totalPrice: number) => void;
  nights: number;
  /** Remaining budget for lodging (total for all nights). Enables "within budget" filter. */
  lodgingCap?: number;
}


type SortKey = 'price' | 'rating' | 'value';
type StarFilter = 'any' | '3' | '4' | '5';

function tierKey(h: HotelTier): string {
  return h.id || `${h.name}-${h.totalPrice}`;
}

function bestValueScore(h: HotelTier): number {
  const price = h.pricePerNight || 1;
  const rating = h.rating || 3.5;
  return rating / Math.log(price + 10);
}

function pickPercentile<T>(arr: T[], p: number): T | undefined {
  if (!arr.length) return undefined;
  const idx = Math.min(arr.length - 1, Math.max(0, Math.floor(arr.length * p)));
  return arr[idx];
}

export function HotelPicker({ tiers, selectedPrice, onSelect, nights, lodgingCap }: HotelPickerProps) {
  const [sortBy, setSortBy] = useState<SortKey>('price');
  const [starFilter, setStarFilter] = useState<StarFilter>('any');
  const [minRating, setMinRating] = useState<number>(0);
  const [maxNightly, setMaxNightly] = useState<number>(0);
  const [withinBudget, setWithinBudget] = useState<boolean>(!!lodgingCap);
  const scrollRef = useRef<HTMLDivElement>(null);


  const priceRange = useMemo(() => {
    if (!tiers.length) return { min: 0, max: 1000 };
    const prices = tiers.map(t => t.pricePerNight).filter(Boolean);
    return {
      min: Math.min(...prices),
      max: Math.max(...prices),
    };
  }, [tiers]);

  // Effective max/night cap: user's value or the natural max (no filter)
  const effectiveMax = maxNightly > 0 ? maxNightly : priceRange.max;


  // Highlight picks: 25th-percentile 4★ = Budget, median 4★ = Comfort, top-rated = Luxury
  const highlights = useMemo(() => {
    if (!tiers.length) return { budget: undefined, comfort: undefined, luxury: undefined };
    const fourPlus = tiers.filter(t => (t.stars ?? 3) >= 4).sort((a, b) => a.pricePerNight - b.pricePerNight);
    const budgetPool = fourPlus.length ? fourPlus : [...tiers].sort((a, b) => a.pricePerNight - b.pricePerNight);
    const budget = pickPercentile(budgetPool, 0.25) || budgetPool[0];
    const comfort = pickPercentile(fourPlus, 0.5) || pickPercentile(budgetPool, 0.5);
    const luxury = [...tiers].sort((a, b) => (b.rating || 0) - (a.rating || 0) || b.pricePerNight - a.pricePerNight)[0];
    return { budget, comfort, luxury };
  }, [tiers]);

  const filtered = useMemo(() => {
    let list = tiers.slice();
    if (starFilter !== 'any') {
      const s = parseInt(starFilter, 10);
      list = list.filter(t => (t.stars ?? 0) >= s);
    }
    if (minRating > 0) list = list.filter(t => (t.rating ?? 0) >= minRating);
    if (maxNightly > 0) list = list.filter(t => t.pricePerNight <= effectiveMax);
    if (withinBudget && lodgingCap && lodgingCap > 0) {
      list = list.filter(t => t.totalPrice <= lodgingCap);
    }
    list.sort((a, b) => {
      if (sortBy === 'price') return a.pricePerNight - b.pricePerNight;
      if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
      return bestValueScore(b) - bestValueScore(a);
    });
    return list;
  }, [tiers, sortBy, starFilter, minRating, maxNightly, withinBudget, lodgingCap, effectiveMax]);


  const virtualizer = useVirtualizer({
    count: filtered.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 132,
    overscan: 4,
  });

  if (tiers.length === 0) {
    return (
      <div className="rounded-xl bg-muted/50 border border-border p-6 text-center">
        <Building2 className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">No hotel options available</p>
      </div>
    );
  }

  const scrollToAndSelect = (h?: HotelTier) => {
    if (!h) return;
    onSelect(h.totalPrice);
    const idx = filtered.findIndex(t => tierKey(t) === tierKey(h));
    if (idx >= 0) {
      virtualizer.scrollToIndex(idx, { align: 'center' });
    }
  };

  const activeFiltersCount =
    (starFilter !== 'any' ? 1 : 0) +
    (minRating > 0 ? 1 : 0) +
    (maxNightly > 0 && maxNightly < priceRange.max ? 1 : 0);

  const quickPicks = [
    { key: 'budget', label: 'Budget', hotel: highlights.budget, color: 'bg-success/10 text-success border-success/30' },
    { key: 'comfort', label: 'Comfort', hotel: highlights.comfort, color: 'bg-primary/10 text-primary border-primary/30' },
    { key: 'luxury', label: 'Luxury', hotel: highlights.luxury, color: 'bg-warning/10 text-warning border-warning/30' },
  ].filter(p => !!p.hotel);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" />
            Choose your hotel
          </h3>
          <p className="text-xs text-muted-foreground">
            {filtered.length} of {tiers.length} properties · {nights} night{nights > 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Quick-pick chips */}
      <div className="flex flex-wrap gap-2">
        {quickPicks.map(p => {
          const isSelected = p.hotel && p.hotel.totalPrice === selectedPrice;
          return (
            <button
              key={p.key}
              onClick={() => scrollToAndSelect(p.hotel)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-semibold border transition-all',
                p.color,
                isSelected && 'ring-2 ring-primary'
              )}
            >
              {p.label} · ${p.hotel?.pricePerNight}/night
            </button>
          );
        })}
      </div>

      {/* Filters + sort */}
      <div className="flex flex-wrap items-center gap-2">
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortKey)}>
          <SelectTrigger className="h-8 w-[150px] text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="price">Sort: Price</SelectItem>
            <SelectItem value="rating">Sort: Rating</SelectItem>
            <SelectItem value="value">Sort: Best value</SelectItem>
          </SelectContent>
        </Select>
        <Select value={starFilter} onValueChange={(v) => setStarFilter(v as StarFilter)}>
          <SelectTrigger className="h-8 w-[120px] text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any stars</SelectItem>
            <SelectItem value="3">3★ +</SelectItem>
            <SelectItem value="4">4★ +</SelectItem>
            <SelectItem value="5">5★</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2 min-w-[180px]">
          <span className="text-xs text-muted-foreground whitespace-nowrap">Min rating</span>
          <Slider
            value={[minRating]}
            min={0}
            max={5}
            step={0.5}
            onValueChange={(v) => setMinRating(v[0])}
            className="w-24"
          />
          <span className="text-xs font-medium tabular-nums w-8">{minRating.toFixed(1)}</span>
        </div>
        <div className="flex items-center gap-2 min-w-[200px]">
          <span className="text-xs text-muted-foreground whitespace-nowrap">Max/night</span>
          <Slider
            value={[maxNightly || priceRange.max]}
            min={priceRange.min}
            max={priceRange.max}
            step={10}
            onValueChange={(v) => setMaxNightly(v[0])}
            className="w-24"
          />
          <span className="text-xs font-medium tabular-nums">${maxNightly || priceRange.max}</span>
        </div>
        {lodgingCap && lodgingCap > 0 && (
          <Button
            variant={withinBudget ? 'default' : 'outline'}
            size="sm"
            className="h-8 text-xs"
            onClick={() => setWithinBudget(v => !v)}
          >
            Under ${lodgingCap.toLocaleString()} total
          </Button>
        )}
        {(activeFiltersCount > 0 || withinBudget) && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs"
            onClick={() => { setStarFilter('any'); setMinRating(0); setMaxNightly(priceRange.max); setWithinBudget(false); }}
          >
            <X className="h-3 w-3 mr-1" /> Clear
          </Button>
        )}

      </div>

      {/* Virtualized card list */}
      <div ref={scrollRef} className="max-h-[560px] overflow-y-auto rounded-lg border border-border">
        {filtered.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">No hotels match your filters.</div>
        ) : (
          <div style={{ height: virtualizer.getTotalSize(), position: 'relative', width: '100%' }}>
            {virtualizer.getVirtualItems().map(vi => {
              const h = filtered[vi.index];
              const isSelected = h.totalPrice === selectedPrice;
              return (
                <div
                  key={tierKey(h)}
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', transform: `translateY(${vi.start}px)`, height: vi.size }}
                  className="p-2"
                >
                  <button
                    onClick={() => onSelect(h.totalPrice)}
                    className={cn(
                      'w-full text-left rounded-lg border border-border overflow-hidden flex gap-3 p-2 hover:shadow-sm transition-all',
                      isSelected && 'ring-2 ring-primary bg-primary/5'
                    )}
                  >
                    <div className="flex-shrink-0 w-24 h-24 rounded overflow-hidden bg-muted">
                      {h.imageUrl ? (
                        <img src={h.imageUrl} alt={h.name} loading="lazy" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Building2 className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-semibold text-foreground truncate">{h.name}</p>
                            {isSelected && <Check className="h-4 w-4 text-primary flex-shrink-0" />}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            {h.stars ? (
                              <span className="text-xs text-warning">{'★'.repeat(h.stars)}</span>
                            ) : null}
                            {h.rating ? (
                              <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                                <Star className="h-3 w-3 fill-current" />
                                {h.rating.toFixed(1)}
                                {h.reviewCount ? ` (${h.reviewCount.toLocaleString()})` : ''}
                              </span>
                            ) : null}
                          </div>
                          {h.distance && (
                            <p className="text-[11px] text-muted-foreground flex items-center gap-0.5 mt-0.5 truncate">
                              <MapPin className="h-3 w-3" /> {h.distance}
                            </p>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="font-display font-bold text-foreground">${h.pricePerNight}</div>
                          <div className="text-[10px] text-muted-foreground">per night</div>
                          <div className="text-[11px] font-medium text-foreground mt-1">${h.totalPrice.toLocaleString()} total</div>
                        </div>
                      </div>
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {(h.amenities || []).slice(0, 4).map(a => (
                          <Badge key={a} variant="secondary" className="text-[10px] px-1.5 py-0 h-5">{a}</Badge>
                        ))}
                        {h.bookingUrl && (
                          <a
                            href={h.bookingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-[10px] text-primary hover:underline inline-flex items-center gap-0.5 ml-auto"
                          >
                            Book <ArrowUpRight className="h-2.5 w-2.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
