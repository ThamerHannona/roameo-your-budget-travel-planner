import { motion } from 'framer-motion';
import { Mountain, Palmtree, Landmark, UtensilsCrossed, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TravelStyle } from '@/stores/tripSearchStore';

interface TravelStylePickerProps {
  value: TravelStyle;
  onChange: (style: TravelStyle) => void;
  className?: string;
}

const TRAVEL_STYLES: { id: TravelStyle; label: string; icon: typeof Mountain; description: string }[] = [
  { 
    id: 'adventure', 
    label: 'Adventure', 
    icon: Mountain,
    description: 'Hiking, extreme sports, nature' 
  },
  { 
    id: 'relaxation', 
    label: 'Relaxation', 
    icon: Palmtree,
    description: 'Beaches, spas, slow travel' 
  },
  { 
    id: 'culture', 
    label: 'Culture', 
    icon: Landmark,
    description: 'Museums, history, architecture' 
  },
  { 
    id: 'food', 
    label: 'Food & Drink', 
    icon: UtensilsCrossed,
    description: 'Local cuisine, wine, markets' 
  },
  { 
    id: 'mix', 
    label: 'Mix of All', 
    icon: Sparkles,
    description: 'Balanced experience' 
  },
];

export function TravelStylePicker({ value, onChange, className }: TravelStylePickerProps) {
  return (
    <div className={cn('space-y-3', className)}>
      <label className="text-sm font-medium text-muted-foreground">
        What's your travel style?
      </label>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {TRAVEL_STYLES.map((style) => {
          const isSelected = value === style.id;
          const Icon = style.icon;
          
          return (
            <motion.button
              key={style.id}
              type="button"
              onClick={() => onChange(style.id)}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                'relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200',
                isSelected
                  ? 'border-primary bg-primary/10 shadow-lg'
                  : 'border-border bg-card hover:border-primary/50 hover:shadow-md'
              )}
            >
              {isSelected && (
                <motion.div
                  layoutId="style-selected"
                  className="absolute inset-0 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl"
                  initial={false}
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
              
              <div className={cn(
                'relative z-10 w-12 h-12 rounded-full flex items-center justify-center transition-colors',
                isSelected 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted/30 text-muted-foreground'
              )}>
                <Icon className="h-6 w-6" />
              </div>
              
              <div className="relative z-10 text-center">
                <p className={cn(
                  'font-semibold text-sm',
                  isSelected ? 'text-primary' : 'text-foreground'
                )}>
                  {style.label}
                </p>
                <p className="text-xs text-muted-foreground hidden sm:block">
                  {style.description}
                </p>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
