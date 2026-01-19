import { motion } from 'framer-motion';
import { Backpack, Compass, Crown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TripStyle } from '@/types/trip';

interface TripStyleSelectorProps {
  value: TripStyle;
  onChange: (style: TripStyle) => void;
}

const tripStyles = [
  {
    id: 'budget' as TripStyle,
    title: 'Budget Backpacker',
    description: 'Maximize experiences, minimize spending. Hostels, street food, public transit.',
    priceRange: '$–$$',
    icon: Backpack,
    color: 'from-success/20 to-success/5',
    borderColor: 'border-success',
  },
  {
    id: 'balanced' as TripStyle,
    title: 'Balanced Explorer',
    description: 'Best of both worlds. Mix of budget-friendly and comfortable options.',
    priceRange: '$$–$$$',
    icon: Compass,
    color: 'from-primary/20 to-primary/5',
    borderColor: 'border-primary',
  },
  {
    id: 'comfort' as TripStyle,
    title: 'Comfort Seeker',
    description: 'Premium experiences, quality accommodations, convenience first.',
    priceRange: '$$$–$$$$',
    icon: Crown,
    color: 'from-warning/20 to-warning/5',
    borderColor: 'border-warning',
  },
];

export function TripStyleSelector({ value, onChange }: TripStyleSelectorProps) {
  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-foreground">Trip Style</label>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {tripStyles.map((style) => {
          const isSelected = value === style.id;
          const Icon = style.icon;

          return (
            <motion.button
              key={style.id}
              type="button"
              onClick={() => onChange(style.id)}
              className={cn(
                'relative p-5 rounded-xl border-2 text-left transition-all',
                'hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                isSelected
                  ? `${style.borderColor} bg-gradient-to-br ${style.color}`
                  : 'border-border bg-card hover:border-muted-foreground/30'
              )}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Selected indicator */}
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-3 right-3 w-6 h-6 rounded-full bg-primary flex items-center justify-center"
                >
                  <Check className="h-4 w-4 text-primary-foreground" />
                </motion.div>
              )}

              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center',
                    isSelected ? 'bg-primary/20' : 'bg-muted'
                  )}
                >
                  <Icon
                    className={cn(
                      'h-5 w-5',
                      isSelected ? 'text-primary' : 'text-muted-foreground'
                    )}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3
                      className={cn(
                        'font-display font-semibold text-sm',
                        isSelected ? 'text-foreground' : 'text-foreground'
                      )}
                    >
                      {style.title}
                    </h3>
                    <span
                      className={cn(
                        'text-xs font-medium px-2 py-0.5 rounded-full',
                        isSelected
                          ? 'bg-primary/20 text-primary'
                          : 'bg-muted text-muted-foreground'
                      )}
                    >
                      {style.priceRange}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {style.description}
                  </p>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
