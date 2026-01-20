import { motion } from 'framer-motion';
import { Filter, SortAsc, Globe, DollarSign, Sun, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Destination } from '@/types/destination';
import { cn } from '@/lib/utils';

interface DiscoverFiltersProps {
  sortBy: 'value' | 'cost' | 'weather' | 'crowd';
  onSortChange: (sort: 'value' | 'cost' | 'weather' | 'crowd') => void;
  regionFilter: Destination['region'] | 'all';
  onRegionChange: (region: Destination['region'] | 'all') => void;
  resultCount: number;
}

const regions: { value: Destination['region'] | 'all'; label: string }[] = [
  { value: 'all', label: 'All Regions' },
  { value: 'Europe', label: 'Europe' },
  { value: 'Asia', label: 'Asia' },
  { value: 'North America', label: 'North America' },
  { value: 'South America', label: 'South America' },
  { value: 'Caribbean', label: 'Caribbean' },
  { value: 'Middle East', label: 'Middle East' },
  { value: 'Africa', label: 'Africa' },
  { value: 'Oceania', label: 'Oceania' },
];

const sortOptions = [
  { value: 'value', label: 'Best Value', icon: DollarSign },
  { value: 'cost', label: 'Lowest Cost', icon: DollarSign },
  { value: 'weather', label: 'Best Weather', icon: Sun },
  { value: 'crowd', label: 'Least Crowded', icon: Users },
] as const;

export function DiscoverFilters({
  sortBy,
  onSortChange,
  regionFilter,
  onRegionChange,
  resultCount,
}: DiscoverFiltersProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-card rounded-xl border border-border"
    >
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium text-foreground">
          {resultCount} destinations within budget
        </span>
      </div>
      
      <div className="flex flex-wrap items-center gap-3">
        {/* Sort */}
        <div className="flex items-center gap-2">
          <SortAsc className="h-4 w-4 text-muted-foreground" />
          <div className="flex gap-1">
            {sortOptions.map((option) => (
              <Button
                key={option.value}
                variant={sortBy === option.value ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onSortChange(option.value)}
                className="h-8 text-xs"
              >
                <option.icon className="h-3 w-3 mr-1" />
                {option.label}
              </Button>
            ))}
          </div>
        </div>
        
        {/* Region Filter */}
        <Select value={regionFilter} onValueChange={(v) => onRegionChange(v as Destination['region'] | 'all')}>
          <SelectTrigger className="w-[160px] h-8">
            <Globe className="h-3 w-3 mr-2" />
            <SelectValue placeholder="Region" />
          </SelectTrigger>
          <SelectContent>
            {regions.map((region) => (
              <SelectItem key={region.value} value={region.value}>
                {region.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </motion.div>
  );
}
