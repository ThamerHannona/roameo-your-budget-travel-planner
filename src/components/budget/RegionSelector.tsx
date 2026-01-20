import { motion } from 'framer-motion';
import { Check, Globe2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TravelRegion } from '@/stores/tripSearchStore';

interface RegionSelectorProps {
  selected: TravelRegion[];
  onToggle: (region: TravelRegion) => void;
  className?: string;
}

const REGIONS: { id: TravelRegion; label: string; emoji: string; color: string }[] = [
  { id: 'europe', label: 'Europe', emoji: '🇪🇺', color: 'from-blue-500 to-blue-600' },
  { id: 'asia', label: 'Asia', emoji: '🌏', color: 'from-rose-500 to-rose-600' },
  { id: 'americas', label: 'Americas', emoji: '🌎', color: 'from-green-500 to-green-600' },
  { id: 'africa', label: 'Africa', emoji: '🌍', color: 'from-amber-500 to-amber-600' },
  { id: 'oceania', label: 'Oceania', emoji: '🏝️', color: 'from-cyan-500 to-cyan-600' },
  { id: 'anywhere', label: 'Anywhere', emoji: '✨', color: 'from-purple-500 to-pink-500' },
];

export function RegionSelector({ selected, onToggle, className }: RegionSelectorProps) {
  const isAnywhere = selected.includes('anywhere');

  return (
    <div className={cn('space-y-3', className)}>
      <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
        <Globe2 className="h-4 w-4" />
        Where would you go?
      </label>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {REGIONS.map((region) => {
          const isSelected = selected.includes(region.id);
          const isDisabled = isAnywhere && region.id !== 'anywhere';
          
          return (
            <motion.button
              key={region.id}
              type="button"
              onClick={() => onToggle(region.id)}
              disabled={isDisabled}
              whileHover={{ scale: isDisabled ? 1 : 1.02 }}
              whileTap={{ scale: isDisabled ? 1 : 0.98 }}
              className={cn(
                'relative flex items-center gap-2 px-4 py-3 rounded-xl border-2 transition-all duration-200',
                isSelected && !isDisabled
                  ? 'border-primary bg-primary/10 shadow-md'
                  : 'border-border bg-card hover:border-primary/50',
                isDisabled && 'opacity-40 cursor-not-allowed'
              )}
            >
              <span className="text-xl">{region.emoji}</span>
              <span className={cn(
                'font-medium flex-1 text-left',
                isSelected ? 'text-primary' : 'text-foreground'
              )}>
                {region.label}
              </span>
              
              {isSelected && !isDisabled && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-5 h-5 rounded-full bg-primary flex items-center justify-center"
                >
                  <Check className="h-3 w-3 text-primary-foreground" />
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>

      {selected.length === 0 && (
        <p className="text-xs text-muted-foreground italic">
          Select regions or choose "Anywhere" to explore all possibilities
        </p>
      )}
    </div>
  );
}
