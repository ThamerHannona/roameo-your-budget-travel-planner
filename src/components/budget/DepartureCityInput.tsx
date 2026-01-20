import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface DepartureCityInputProps {
  value: string;
  onChange: (city: string) => void;
  error?: string;
  className?: string;
}

// Popular departure cities for quick suggestions
const POPULAR_CITIES = [
  { name: 'New York, NY', code: 'JFK' },
  { name: 'Los Angeles, CA', code: 'LAX' },
  { name: 'San Francisco, CA', code: 'SFO' },
  { name: 'Chicago, IL', code: 'ORD' },
  { name: 'Miami, FL', code: 'MIA' },
  { name: 'Boston, MA', code: 'BOS' },
  { name: 'Seattle, WA', code: 'SEA' },
  { name: 'Denver, CO', code: 'DEN' },
  { name: 'Atlanta, GA', code: 'ATL' },
  { name: 'Austin, TX', code: 'AUS' },
  { name: 'London, UK', code: 'LHR' },
  { name: 'Toronto, Canada', code: 'YYZ' },
];

export function DepartureCityInput({ value, onChange, error, className }: DepartureCityInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<typeof POPULAR_CITIES>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter suggestions based on input
  useEffect(() => {
    if (value.length > 0) {
      const filtered = POPULAR_CITIES.filter(
        city => 
          city.name.toLowerCase().includes(value.toLowerCase()) ||
          city.code.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(filtered.slice(0, 5));
    } else {
      setSuggestions(POPULAR_CITIES.slice(0, 5));
    }
  }, [value]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (city: typeof POPULAR_CITIES[0]) => {
    onChange(city.name);
    setIsFocused(false);
    inputRef.current?.blur();
  };

  return (
    <div ref={containerRef} className={cn('space-y-2 relative', className)}>
      <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
        <MapPin className="h-4 w-4" />
        Departure City
      </label>
      
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          placeholder="Where are you flying from?"
          className={cn(
            'h-12 pl-4 pr-10 text-base',
            error && 'border-destructive focus-visible:ring-destructive'
          )}
        />
        
        {/* Dropdown */}
        <AnimatePresence>
          {isFocused && suggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden"
            >
              {suggestions.map((city, index) => (
                <motion.button
                  key={city.code}
                  type="button"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleSelect(city)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left"
                >
                  <MapPin className="h-4 w-4 text-primary" />
                  <span className="flex-1 font-medium">{city.name}</span>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                    {city.code}
                  </span>
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}
