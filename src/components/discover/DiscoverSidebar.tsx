import { motion } from 'framer-motion';
import { Filter, Plane, Sun, Users, DollarSign, Star, RotateCcw } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

export interface DiscoverFiltersState {
  maxPrice: number;
  minConfidence: number;
  weatherPreference: 'any' | 'sunny' | 'mild' | 'cool';
  crowdTolerance: 'any' | 'avoid-crowds' | 'moderate' | 'dont-mind';
  directFlightsOnly: boolean;
  sortBy: 'value' | 'price' | 'confidence' | 'flight-time';
}

interface DiscoverSidebarProps {
  filters: DiscoverFiltersState;
  onFiltersChange: (filters: Partial<DiscoverFiltersState>) => void;
  onReset: () => void;
  maxBudget: number;
  className?: string;
}

const weatherOptions = [
  { value: 'any', label: 'Any Weather' },
  { value: 'sunny', label: '☀️ Sunny & Warm' },
  { value: 'mild', label: '🌤️ Mild & Pleasant' },
  { value: 'cool', label: '❄️ Cool & Crisp' },
];

const crowdOptions = [
  { value: 'any', label: 'Any Crowd Level' },
  { value: 'avoid-crowds', label: '🧘 Avoid Crowds' },
  { value: 'moderate', label: '👥 Moderate' },
  { value: 'dont-mind', label: '🎉 Don\'t Mind Crowds' },
];

const sortOptions = [
  { value: 'value', label: 'Best Value', icon: Star },
  { value: 'price', label: 'Lowest Price', icon: DollarSign },
  { value: 'confidence', label: 'Highest Confidence', icon: Star },
  { value: 'flight-time', label: 'Shortest Flight', icon: Plane },
];

export function DiscoverSidebar({
  filters,
  onFiltersChange,
  onReset,
  maxBudget,
  className,
}: DiscoverSidebarProps) {
  const hasActiveFilters = 
    filters.maxPrice < maxBudget ||
    filters.minConfidence > 70 ||
    filters.weatherPreference !== 'any' ||
    filters.crowdTolerance !== 'any' ||
    filters.directFlightsOnly;

  return (
    <motion.aside
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn(
        'bg-card border border-border rounded-xl p-4 space-y-6',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold text-foreground">Filters</h3>
        </div>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={onReset} className="text-xs gap-1">
            <RotateCcw className="h-3 w-3" />
            Reset
          </Button>
        )}
      </div>

      <Separator />

      {/* Sort By */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Sort By</Label>
        <Select
          value={filters.sortBy}
          onValueChange={(v) => onFiltersChange({ sortBy: v as DiscoverFiltersState['sortBy'] })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                <div className="flex items-center gap-2">
                  <option.icon className="h-3.5 w-3.5" />
                  {option.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Max Price */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Max Price</Label>
          <span className="text-sm font-semibold text-primary">
            ${filters.maxPrice.toLocaleString()}
          </span>
        </div>
        <Slider
          value={[filters.maxPrice]}
          onValueChange={([v]) => onFiltersChange({ maxPrice: v })}
          min={500}
          max={maxBudget}
          step={100}
        />
        <p className="text-xs text-muted-foreground">
          Show destinations up to this price
        </p>
      </div>

      <Separator />

      {/* Confidence Score */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Min Confidence</Label>
          <span className="text-sm font-semibold text-primary">
            {filters.minConfidence}%
          </span>
        </div>
        <Slider
          value={[filters.minConfidence]}
          onValueChange={([v]) => onFiltersChange({ minConfidence: v })}
          min={70}
          max={98}
          step={1}
        />
        <p className="text-xs text-muted-foreground">
          Higher = more reliable estimates
        </p>
      </div>

      <Separator />

      {/* Weather Preference */}
      <div className="space-y-3">
        <Label className="text-sm font-medium flex items-center gap-2">
          <Sun className="h-3.5 w-3.5" />
          Weather
        </Label>
        <Select
          value={filters.weatherPreference}
          onValueChange={(v) => onFiltersChange({ weatherPreference: v as DiscoverFiltersState['weatherPreference'] })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {weatherOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Crowd Tolerance */}
      <div className="space-y-3">
        <Label className="text-sm font-medium flex items-center gap-2">
          <Users className="h-3.5 w-3.5" />
          Crowds
        </Label>
        <Select
          value={filters.crowdTolerance}
          onValueChange={(v) => onFiltersChange({ crowdTolerance: v as DiscoverFiltersState['crowdTolerance'] })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {crowdOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Direct Flights Toggle */}
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium flex items-center gap-2">
          <Plane className="h-3.5 w-3.5" />
          Direct Flights Only
        </Label>
        <Switch
          checked={filters.directFlightsOnly}
          onCheckedChange={(v) => onFiltersChange({ directFlightsOnly: v })}
        />
      </div>
    </motion.aside>
  );
}
