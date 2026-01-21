import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import type { QuickSelectOption } from '@/types/dateFlexibility';

interface QuickSelectButtonsProps {
  options: QuickSelectOption[];
  onSelect: (option: QuickSelectOption) => void;
  currentPrice: number;
}

export function QuickSelectButtons({ options, onSelect, currentPrice }: QuickSelectButtonsProps) {
  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-foreground">Quick Select</h4>
      <div className="flex flex-wrap gap-2">
        {options.map((option, index) => {
          const savings = currentPrice - option.price;
          const hasSavings = savings > 0;

          return (
            <motion.button
              key={option.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => onSelect(option)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-full border transition-all',
                'bg-card hover:bg-muted border-border hover:border-primary',
                'text-sm font-medium'
              )}
            >
              <span>{option.icon}</span>
              <span>{option.label}</span>
              {hasSavings && (
                <span className="text-xs text-success font-medium">
                  -${savings}
                </span>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
