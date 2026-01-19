import { useState, useRef, useEffect } from 'react';
import { MapPin, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

// Popular cities for autocomplete suggestions
const POPULAR_CITIES = [
  { city: 'New York', code: 'NYC', country: 'United States' },
  { city: 'Los Angeles', code: 'LAX', country: 'United States' },
  { city: 'Chicago', code: 'ORD', country: 'United States' },
  { city: 'San Francisco', code: 'SFO', country: 'United States' },
  { city: 'Miami', code: 'MIA', country: 'United States' },
  { city: 'Seattle', code: 'SEA', country: 'United States' },
  { city: 'Boston', code: 'BOS', country: 'United States' },
  { city: 'Denver', code: 'DEN', country: 'United States' },
  { city: 'Las Vegas', code: 'LAS', country: 'United States' },
  { city: 'Atlanta', code: 'ATL', country: 'United States' },
  { city: 'London', code: 'LHR', country: 'United Kingdom' },
  { city: 'Paris', code: 'CDG', country: 'France' },
  { city: 'Tokyo', code: 'NRT', country: 'Japan' },
  { city: 'Sydney', code: 'SYD', country: 'Australia' },
  { city: 'Dubai', code: 'DXB', country: 'UAE' },
  { city: 'Rome', code: 'FCO', country: 'Italy' },
  { city: 'Barcelona', code: 'BCN', country: 'Spain' },
  { city: 'Amsterdam', code: 'AMS', country: 'Netherlands' },
  { city: 'Toronto', code: 'YYZ', country: 'Canada' },
  { city: 'Singapore', code: 'SIN', country: 'Singapore' },
  { city: 'Hong Kong', code: 'HKG', country: 'Hong Kong' },
  { city: 'Bangkok', code: 'BKK', country: 'Thailand' },
  { city: 'Berlin', code: 'BER', country: 'Germany' },
  { city: 'Mexico City', code: 'MEX', country: 'Mexico' },
];

interface CityAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  className?: string;
}

export function CityAutocomplete({
  value,
  onChange,
  placeholder = 'Enter city',
  label,
  error,
  className,
}: CityAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<typeof POPULAR_CITIES>([]);
  const [isLoading, setIsLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (inputValue: string) => {
    onChange(inputValue);
    
    if (inputValue.length >= 1) {
      setIsLoading(true);
      // Simulate API delay
      setTimeout(() => {
        const filtered = POPULAR_CITIES.filter(
          (city) =>
            city.city.toLowerCase().includes(inputValue.toLowerCase()) ||
            city.code.toLowerCase().includes(inputValue.toLowerCase()) ||
            city.country.toLowerCase().includes(inputValue.toLowerCase())
        ).slice(0, 6);
        setSuggestions(filtered);
        setIsOpen(filtered.length > 0);
        setIsLoading(false);
      }, 150);
    } else {
      setSuggestions([]);
      setIsOpen(false);
    }
  };

  const handleSelect = (city: typeof POPULAR_CITIES[0]) => {
    onChange(`${city.city}, ${city.country}`);
    setIsOpen(false);
  };

  return (
    <div ref={wrapperRef} className={cn('relative', className)}>
      {label && (
        <div className="flex items-center gap-2 mb-2">
          <MapPin className="h-4 w-4 text-primary" />
          <label className="text-sm font-medium text-foreground">{label}</label>
        </div>
      )}
      
      <div className="relative">
        <Input
          value={value}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => value.length >= 1 && suggestions.length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          className={cn(
            'h-12 pl-4 pr-10',
            error && 'border-destructive focus-visible:ring-destructive'
          )}
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-destructive mt-1">{error}</p>
      )}

      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-card rounded-lg border border-border shadow-lg overflow-hidden">
          {suggestions.map((city) => (
            <button
              key={city.code}
              type="button"
              onClick={() => handleSelect(city)}
              className="w-full px-4 py-3 flex items-center gap-3 hover:bg-muted transition-colors text-left"
            >
              <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">
                  {city.city}
                </p>
                <p className="text-sm text-muted-foreground truncate">
                  {city.code} • {city.country}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
