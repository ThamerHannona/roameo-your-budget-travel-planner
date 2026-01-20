import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface DurationChipsProps {
  value: number;
  onChange: (days: number) => void;
  className?: string;
}

const DURATION_OPTIONS = [
  { days: 3, label: '3 days', subtitle: 'Weekend' },
  { days: 5, label: '5 days', subtitle: 'Short trip' },
  { days: 7, label: '7 days', subtitle: 'Full week' },
  { days: 10, label: '10 days', subtitle: 'Extended' },
  { days: 14, label: '14 days', subtitle: 'Adventure' },
];

export function DurationChips({ value, onChange, className }: DurationChipsProps) {
  return (
    <div className={cn('space-y-3', className)}>
      <label className="text-sm font-medium text-muted-foreground">
        Trip Duration
      </label>
      
      <div className="flex flex-wrap gap-2">
        {DURATION_OPTIONS.map((option) => {
          const isSelected = value === option.days;
          
          return (
            <motion.button
              key={option.days}
              type="button"
              onClick={() => onChange(option.days)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                'relative px-4 py-3 rounded-xl border-2 transition-all duration-200',
                'flex flex-col items-center min-w-[80px]',
                isSelected
                  ? 'border-primary bg-primary/10 text-primary shadow-md'
                  : 'border-border bg-card hover:border-primary/50 hover:bg-card/80'
              )}
            >
              {isSelected && (
                <motion.div
                  layoutId="duration-selected"
                  className="absolute inset-0 bg-primary/5 rounded-xl"
                  initial={false}
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
              
              <span className={cn(
                'relative z-10 text-lg font-bold',
                isSelected ? 'text-primary' : 'text-foreground'
              )}>
                {option.label}
              </span>
              <span className={cn(
                'relative z-10 text-xs',
                isSelected ? 'text-primary/80' : 'text-muted-foreground'
              )}>
                {option.subtitle}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
