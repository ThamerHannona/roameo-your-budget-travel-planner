import { motion } from 'framer-motion';
import { DollarSign } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface BudgetSliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  budgetPerDay: number;
  className?: string;
}

export function BudgetSlider({
  value,
  onChange,
  min = 500,
  max = 10000,
  budgetPerDay,
  className,
}: BudgetSliderProps) {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^0-9]/g, '');
    const numValue = parseInt(rawValue) || min;
    onChange(Math.max(min, Math.min(max, numValue)));
  };

  const formatCurrency = (num: number) => {
    return num.toLocaleString('en-US');
  };

  // Calculate percentage for color gradient
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Budget Input */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <label className="text-sm font-medium text-muted-foreground mb-2 block">
            Total Budget
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-primary">
              $
            </span>
            <Input
              type="text"
              inputMode="numeric"
              value={formatCurrency(value)}
              onChange={handleInputChange}
              className="text-3xl font-display font-bold h-16 pl-10 pr-4 text-foreground"
              placeholder="2,000"
            />
          </div>
        </div>

        {/* Budget per day display */}
        <motion.div
          key={budgetPerDay}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center bg-primary/10 rounded-xl p-4 min-w-[120px]"
        >
          <p className="text-sm text-muted-foreground">Per day</p>
          <p className="text-2xl font-bold text-primary">${budgetPerDay}</p>
        </motion.div>
      </div>

      {/* Slider */}
      <div className="space-y-2">
        <Slider
          value={[value]}
          onValueChange={([newValue]) => onChange(newValue)}
          min={min}
          max={max}
          step={100}
          className="py-2"
        />
        
        {/* Range labels */}
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>${formatCurrency(min)}</span>
          <span className="text-primary font-medium">
            {percentage < 33 ? 'Budget Explorer' : percentage < 66 ? 'Balanced Traveler' : 'Luxury Seeker'}
          </span>
          <span>${formatCurrency(max)}</span>
        </div>
      </div>
    </div>
  );
}
