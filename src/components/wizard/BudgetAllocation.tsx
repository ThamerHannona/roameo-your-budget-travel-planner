import { motion } from 'framer-motion';
import { Plane, Hotel, Map, Utensils, Train, Shield, RotateCcw, Lightbulb } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { BudgetBreakdown } from '@/types/trip';
import { DEFAULT_BUDGET_PERCENTAGES } from '@/types/trip';

interface BudgetAllocationProps {
  totalBudget: number;
  breakdown: BudgetBreakdown;
  onChange: (breakdown: BudgetBreakdown) => void;
}

const categories = [
  { key: 'flights' as keyof BudgetBreakdown, label: 'Flights', icon: Plane, color: 'bg-primary' },
  { key: 'accommodation' as keyof BudgetBreakdown, label: 'Accommodation', icon: Hotel, color: 'bg-success' },
  { key: 'activities' as keyof BudgetBreakdown, label: 'Activities', icon: Map, color: 'bg-warning' },
  { key: 'food' as keyof BudgetBreakdown, label: 'Food', icon: Utensils, color: 'bg-destructive' },
  { key: 'transportation' as keyof BudgetBreakdown, label: 'Transport', icon: Train, color: 'bg-accent-foreground' },
  { key: 'buffer' as keyof BudgetBreakdown, label: 'Buffer', icon: Shield, color: 'bg-muted-foreground' },
];

export function BudgetAllocation({ totalBudget, breakdown, onChange }: BudgetAllocationProps) {
  const total = Object.values(breakdown).reduce((sum, val) => sum + val, 0);

  const handleSliderChange = (key: keyof BudgetBreakdown, newValue: number) => {
    const oldValue = breakdown[key];
    const diff = newValue - oldValue;
    
    // Distribute the difference proportionally among other categories
    const otherKeys = Object.keys(breakdown).filter(k => k !== key) as (keyof BudgetBreakdown)[];
    const otherTotal = otherKeys.reduce((sum, k) => sum + breakdown[k], 0);
    
    if (otherTotal === 0 || diff === 0) {
      onChange({ ...breakdown, [key]: newValue });
      return;
    }

    const newBreakdown = { ...breakdown, [key]: newValue };
    
    otherKeys.forEach((k) => {
      const proportion = breakdown[k] / otherTotal;
      const adjustment = Math.round(diff * proportion);
      newBreakdown[k] = Math.max(0, breakdown[k] - adjustment);
    });

    // Ensure total is exactly 100
    const newTotal = Object.values(newBreakdown).reduce((sum, val) => sum + val, 0);
    if (newTotal !== 100) {
      const adjustment = 100 - newTotal;
      // Add adjustment to the largest non-current category
      const largestKey = otherKeys.reduce((a, b) => 
        newBreakdown[a] > newBreakdown[b] ? a : b
      );
      newBreakdown[largestKey] = Math.max(0, newBreakdown[largestKey] + adjustment);
    }

    onChange(newBreakdown);
  };

  const resetToDefaults = () => {
    onChange({ ...DEFAULT_BUDGET_PERCENTAGES });
  };

  const getDollarAmount = (percentage: number) => {
    return Math.round((totalBudget * percentage) / 100);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-display font-semibold text-foreground">
            Budget Allocation
          </h3>
          <p className="text-sm text-muted-foreground">
            Drag sliders to customize how you want to spend your ${totalBudget.toLocaleString()}
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={resetToDefaults}
          className="text-muted-foreground hover:text-foreground"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset
        </Button>
      </div>

      {/* Visual breakdown bar */}
      <div className="h-8 rounded-full overflow-hidden flex shadow-inner bg-muted">
        {categories.map((cat, index) => {
          const percentage = breakdown[cat.key];
          if (percentage === 0) return null;
          
          return (
            <motion.div
              key={cat.key}
              className={cn(cat.color, 'flex items-center justify-center')}
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              style={{ minWidth: percentage > 5 ? '30px' : '0' }}
            >
              {percentage >= 10 && (
                <span className="text-xs font-medium text-white">
                  {percentage}%
                </span>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Category sliders */}
      <div className="space-y-5">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const percentage = breakdown[cat.key];
          const amount = getDollarAmount(percentage);

          return (
            <div key={cat.key} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', cat.color)}>
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                  <span className="font-medium text-foreground">{cat.label}</span>
                </div>
                <div className="text-right">
                  <span className="font-display font-bold text-foreground">
                    ${amount.toLocaleString()}
                  </span>
                  <span className="text-muted-foreground ml-2">({percentage}%)</span>
                </div>
              </div>
              <Slider
                value={[percentage]}
                onValueChange={([val]) => handleSliderChange(cat.key, val)}
                max={80}
                min={0}
                step={1}
                className="w-full"
              />
            </div>
          );
        })}
      </div>

      {/* Smart tip */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start gap-3 p-4 bg-primary/5 border border-primary/20 rounded-xl"
      >
        <Lightbulb className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-foreground">Smart Tip</p>
          <p className="text-sm text-muted-foreground">
            {breakdown.flights > 35
              ? 'Consider reducing flight budget – premium economy often is not worth the extra cost.'
              : breakdown.activities < 15
              ? 'Increase activities budget to get more out of your destination!'
              : breakdown.buffer < 5
              ? 'A higher buffer protects against unexpected expenses.'
              : 'Your allocation looks balanced! Ready to explore options.'}
          </p>
        </div>
      </motion.div>

      {total !== 100 && (
        <p className="text-sm text-destructive">
          Total must equal 100%. Current: {total}%
        </p>
      )}
    </div>
  );
}
