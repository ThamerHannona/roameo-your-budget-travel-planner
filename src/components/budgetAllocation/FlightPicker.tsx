import { useMemo, useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { motion } from 'framer-motion';
import { Plane, Check, ArrowUpRight, TrendingDown, Sparkles, Award, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { FlightOption } from '@/types/budgetConstraints';

interface FlightPickerProps {
  options: FlightOption[];
  selectedPrice: number;
  onSelect: (price: number) => void;
  travelers?: number;
  /** Optional transport budget cap (total across travelers). Enables "within budget" filter. */
  transportCap?: number;
}


type SortKey = 'price' | 'duration' | 'stops';
type StopsFilter = 'any' | 'nonstop' | 'onestop';
type WindowFilter = 'any' | 'morning' | 'afternoon' | 'evening' | 'redeye';

function optionKey(o: FlightOption): string {
  return o.id || `${o.airline}-${o.flightNumber}-${o.price}`;
}

function parseHour(time?: string): number | null {
  if (!time) return null;
  // Accept "HH:MM" or ISO
  const m = time.match(/(\d{1,2}):(\d{2})/);
  if (!m) return null;
  return parseInt(m[1], 10);
}

function parseDurationMin(d: string): number {
  const h = d.match(/(\d+)\s*h/);
  const m = d.match(/(\d+)\s*m/);
  return (h ? parseInt(h[1], 10) : 0) * 60 + (m ? parseInt(m[1], 10) : 0);
}

function deriveTierIds(opts: FlightOption[]): { budget?: string; recommended?: string; premium?: string } {
  if (!opts.length) return {};
  const byPrice = [...opts].sort((a, b) => a.price - b.price);
  const budget = byPrice[0];
  // Recommended: best price × duration score
  const withScore = opts.map(o => ({
    o,
    score: o.price * (o.durationMinutes || parseDurationMin(o.duration) || 600),
  }));
  withScore.sort((a, b) => a.score - b.score);
  const recommended = withScore[0].o;
  // Premium: direct flight or most expensive
  const direct = opts.find(o => o.stops === 0);
  const premium = direct || byPrice[byPrice.length - 1];
  return {
    budget: optionKey(budget),
    recommended: optionKey(recommended),
    premium: optionKey(premium),
  };
}

export function FlightPicker({ options, selectedPrice, onSelect, travelers = 1, transportCap }: FlightPickerProps) {
  const [sortBy, setSortBy] = useState<SortKey>('price');
  const [maxStops, setMaxStops] = useState<StopsFilter>('any');
  const [windowFilter, setWindowFilter] = useState<WindowFilter>('any');
  const [airlineFilter, setAirlineFilter] = useState<string>('all');
  const [withinBudget, setWithinBudget] = useState<boolean>(!!transportCap);
  const scrollRef = useRef<HTMLDivElement>(null);


  const airlines = useMemo(() => {
    const set = new Set<string>();
    options.forEach(o => o.airline && set.add(o.airline));
    return Array.from(set).sort();
  }, [options]);

  const tierIds = useMemo(() => deriveTierIds(options), [options]);

  const filtered = useMemo(() => {
    let list = options.slice();
    if (maxStops === 'nonstop') list = list.filter(o => o.stops === 0);
    else if (maxStops === 'onestop') list = list.filter(o => o.stops <= 1);
    if (airlineFilter !== 'all') list = list.filter(o => o.airline === airlineFilter);
    if (withinBudget && transportCap && transportCap > 0) {
      list = list.filter(o => o.price <= transportCap);
    }
    if (windowFilter !== 'any') {
      list = list.filter(o => {
        const h = parseHour(o.departureTime);
        if (h == null) return true;
        if (windowFilter === 'morning') return h >= 5 && h < 12;
        if (windowFilter === 'afternoon') return h >= 12 && h < 17;
        if (windowFilter === 'evening') return h >= 17 && h < 22;
        return h >= 22 || h < 5; // redeye
      });
    }
    list.sort((a, b) => {
      if (sortBy === 'price') return a.price - b.price;
      if (sortBy === 'stops') return a.stops - b.stops || a.price - b.price;
      const ad = a.durationMinutes || parseDurationMin(a.duration);
      const bd = b.durationMinutes || parseDurationMin(b.duration);
      return ad - bd;
    });
    return list;
  }, [options, sortBy, maxStops, windowFilter, airlineFilter, withinBudget, transportCap]);

  // Detect: cheapest flight exceeds transport cap → nothing fits
  const cheapestPrice = useMemo(
    () => (options.length ? Math.min(...options.map(o => o.price)) : 0),
    [options]
  );
  const noneFitBudget = !!transportCap && transportCap > 0 && options.length > 0 && cheapestPrice > transportCap;


  const virtualizer = useVirtualizer({
    count: filtered.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 96,
    overscan: 6,
  });

  if (options.length === 0) {
    return (
      <div className="rounded-xl bg-muted/50 border border-border p-6 text-center">
        <Plane className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">No flight options available</p>
      </div>
    );
  }

  const selectByKey = (key?: string) => {
    if (!key) return;
    const found = options.find(o => optionKey(o) === key);
    if (found) onSelect(found.price);
  };

  const tierBudget = options.find(o => optionKey(o) === tierIds.budget);
  const tierRec = options.find(o => optionKey(o) === tierIds.recommended);
  const tierPrem = options.find(o => optionKey(o) === tierIds.premium);

  const highlights: Array<{ opt?: FlightOption; label: string; sub: string; icon: JSX.Element; color: string }> = [
    { opt: tierBudget, label: 'Best Price', sub: 'Cheapest option', icon: <TrendingDown className="h-4 w-4" />, color: 'border-success/40 bg-success/5' },
    { opt: tierRec, label: 'Recommended', sub: 'Best price + time', icon: <Sparkles className="h-4 w-4" />, color: 'border-primary/40 bg-primary/5' },
    { opt: tierPrem, label: 'Premium', sub: tierPrem?.stops === 0 ? 'Direct flight' : 'Top tier', icon: <Award className="h-4 w-4" />, color: 'border-warning/40 bg-warning/5' },
  ].filter(h => !!h.opt);

  const activeFiltersCount =
    (maxStops !== 'any' ? 1 : 0) +
    (windowFilter !== 'any' ? 1 : 0) +
    (airlineFilter !== 'all' ? 1 : 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Plane className="h-4 w-4 text-primary" />
            Choose your flight
          </h3>
          <p className="text-xs text-muted-foreground">
            {filtered.length} of {options.length} options
            {travelers > 1 && ` · prices for ${travelers} travelers`}
            {transportCap ? ` · flight budget $${transportCap.toLocaleString()}` : ''}
          </p>
        </div>
      </div>

      {noneFitBudget && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4">
          <div className="flex items-start gap-3">
            <Plane className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-foreground">
                No flights fit your transport budget
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Cheapest option is <span className="font-semibold text-foreground">${cheapestPrice.toLocaleString()}</span> vs
                cap of <span className="font-semibold text-foreground">${transportCap!.toLocaleString()}</span>.
                Try shifting dates ±3 days, another nearby airport, fewer travelers, or increase your budget.
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => setWithinBudget(false)}>
                  Show all flights anyway
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Highlight strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {highlights.map((h) => {
          const isSelected = h.opt && h.opt.price === selectedPrice;
          return (
            <button
              key={h.label}
              onClick={() => h.opt && onSelect(h.opt.price)}
              className={cn(
                'text-left rounded-lg border p-3 transition-all hover:shadow-sm',
                h.color,
                isSelected && 'ring-2 ring-primary'
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5 text-xs font-semibold">
                  {h.icon}
                  {h.label}
                </div>
                {isSelected && <Check className="h-4 w-4 text-primary" />}
              </div>
              <p className="text-sm font-semibold text-foreground truncate">{h.opt?.airline}</p>
              <p className="text-xs text-muted-foreground truncate">{h.sub}</p>
              <p className="mt-1 font-display font-bold text-foreground">${h.opt?.price.toLocaleString()}</p>
            </button>
          );
        })}
      </div>

      {/* Filters + sort */}
      <div className="flex flex-wrap items-center gap-2">
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortKey)}>
          <SelectTrigger className="h-8 w-[140px] text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="price">Sort: Price</SelectItem>
            <SelectItem value="duration">Sort: Duration</SelectItem>
            <SelectItem value="stops">Sort: Stops</SelectItem>
          </SelectContent>
        </Select>
        <Select value={maxStops} onValueChange={(v) => setMaxStops(v as StopsFilter)}>
          <SelectTrigger className="h-8 w-[120px] text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any stops</SelectItem>
            <SelectItem value="nonstop">Non-stop</SelectItem>
            <SelectItem value="onestop">Max 1 stop</SelectItem>
          </SelectContent>
        </Select>
        <Select value={windowFilter} onValueChange={(v) => setWindowFilter(v as WindowFilter)}>
          <SelectTrigger className="h-8 w-[140px] text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any time</SelectItem>
            <SelectItem value="morning">Morning</SelectItem>
            <SelectItem value="afternoon">Afternoon</SelectItem>
            <SelectItem value="evening">Evening</SelectItem>
            <SelectItem value="redeye">Red-eye</SelectItem>
          </SelectContent>
        </Select>
        {airlines.length > 1 && (
          <Select value={airlineFilter} onValueChange={setAirlineFilter}>
            <SelectTrigger className="h-8 w-[150px] text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All airlines</SelectItem>
              {airlines.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
        {activeFiltersCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs"
            onClick={() => { setMaxStops('any'); setWindowFilter('any'); setAirlineFilter('all'); }}
          >
            <X className="h-3 w-3 mr-1" /> Clear
          </Button>
        )}
      </div>

      {/* Virtualized list */}
      <div
        ref={scrollRef}
        className="max-h-[440px] overflow-y-auto rounded-lg border border-border divide-y divide-border"
      >
        {filtered.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">No flights match your filters.</div>
        ) : (
          <div style={{ height: virtualizer.getTotalSize(), position: 'relative', width: '100%' }}>
            {virtualizer.getVirtualItems().map(vi => {
              const opt = filtered[vi.index];
              const isSelected = opt.price === selectedPrice;
              return (
                <div
                  key={optionKey(opt)}
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', transform: `translateY(${vi.start}px)`, height: vi.size }}
                >
                  <button
                    onClick={() => onSelect(opt.price)}
                    className={cn(
                      'w-full text-left p-3 hover:bg-muted/50 transition-colors flex items-center gap-3',
                      isSelected && 'bg-primary/5 border-l-4 border-primary'
                    )}
                  >
                    <div className="flex-shrink-0 w-8 h-8 rounded bg-muted flex items-center justify-center overflow-hidden">
                      {opt.airlineLogo ? (
                        <img src={opt.airlineLogo} alt="" className="w-full h-full object-contain" />
                      ) : (
                        <Plane className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground truncate">{opt.airline}</span>
                        <span className="text-xs text-muted-foreground truncate">{opt.flightNumber}</span>
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
                        {opt.departureTime && opt.arrivalTime && (
                          <span>{opt.departureTime.slice(-5)} → {opt.arrivalTime.slice(-5)}</span>
                        )}
                        <span>{opt.duration}</span>
                        <span>{opt.stops === 0 ? 'Non-stop' : `${opt.stops} stop${opt.stops > 1 ? 's' : ''}`}</span>
                        {opt.layoverCities?.length ? (
                          <span className="truncate">via {opt.layoverCities.join(', ')}</span>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <div className="font-display font-bold text-foreground">${opt.price.toLocaleString()}</div>
                      {travelers > 1 && (
                        <div className="text-[10px] text-muted-foreground">${Math.round(opt.price / travelers).toLocaleString()}/pp</div>
                      )}
                      {opt.bookingUrl && (
                        <a
                          href={opt.bookingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-[10px] text-primary hover:underline inline-flex items-center gap-0.5"
                        >
                          Book <ArrowUpRight className="h-2.5 w-2.5" />
                        </a>
                      )}
                    </div>
                    {isSelected && <Check className="h-4 w-4 text-primary flex-shrink-0" />}
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
