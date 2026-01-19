import { motion } from 'framer-motion';
import { DollarSign, Info } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { TripStyleSelector } from './TripStyleSelector';
import { InterestTags } from './InterestTags';
import { BudgetAllocation } from './BudgetAllocation';
import type { TripPreferences } from '@/types/trip';

interface StepBudgetStyleProps {
  data: TripPreferences;
  onChange: (data: TripPreferences) => void;
  errors: Record<string, string>;
  onClearError: (field: string) => void;
  destination: string;
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

// Budget suggestions based on destination
const getBudgetSuggestion = (destination: string): string => {
  const lower = destination.toLowerCase();
  if (lower.includes('tokyo') || lower.includes('japan')) {
    return 'Most trips to Tokyo: $1,500–$3,500';
  }
  if (lower.includes('paris') || lower.includes('france')) {
    return 'Most trips to Paris: $2,000–$4,000';
  }
  if (lower.includes('london') || lower.includes('uk')) {
    return 'Most trips to London: $1,800–$3,500';
  }
  if (lower.includes('new york') || lower.includes('nyc')) {
    return 'Most trips to NYC: $1,200–$2,500';
  }
  if (lower.includes('bangkok') || lower.includes('thailand')) {
    return 'Most trips to Bangkok: $800–$1,800';
  }
  return 'Average international trip: $1,500–$3,000';
};

export function StepBudgetStyle({
  data,
  onChange,
  errors,
  onClearError,
  destination,
}: StepBudgetStyleProps) {
  const handleBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^0-9]/g, '');
    const numValue = parseInt(rawValue) || 0;
    onChange({ ...data, totalBudget: numValue });
    onClearError('budget');
  };

  const formatDisplayValue = (num: number) => {
    return num.toLocaleString('en-US');
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
      }}
      className="space-y-8"
    >
      <motion.div variants={itemVariants} className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-2">
          Set your budget & preferences
        </h2>
        <p className="text-muted-foreground">
          We'll optimize your trip to get the most out of every dollar
        </p>
      </motion.div>

      {/* Total Budget Input */}
      <motion.div variants={itemVariants} className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="bg-primary p-2 rounded-lg">
            <DollarSign className="h-5 w-5 text-primary-foreground" />
          </div>
          <label className="text-lg font-display font-semibold text-foreground">
            Total Budget
          </label>
        </div>

        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-primary">
            $
          </span>
          <Input
            type="text"
            inputMode="numeric"
            value={formatDisplayValue(data.totalBudget)}
            onChange={handleBudgetChange}
            className={cn(
              'text-3xl font-display font-bold h-16 pl-10 pr-4 text-foreground',
              errors.budget && 'border-destructive focus-visible:ring-destructive'
            )}
            placeholder="2,000"
          />
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Info className="h-4 w-4" />
          <span>{getBudgetSuggestion(destination)}</span>
        </div>

        {errors.budget && <p className="text-sm text-destructive">{errors.budget}</p>}
      </motion.div>

      {/* Trip Style */}
      <motion.div variants={itemVariants}>
        <TripStyleSelector
          value={data.tripStyle}
          onChange={(style) => onChange({ ...data, tripStyle: style })}
        />
      </motion.div>

      {/* Interests */}
      <motion.div variants={itemVariants}>
        <InterestTags
          selected={data.interests}
          onChange={(interests) => onChange({ ...data, interests })}
        />
      </motion.div>

      {/* Budget Allocation */}
      <motion.div variants={itemVariants}>
        <BudgetAllocation
          totalBudget={data.totalBudget}
          breakdown={data.budgetBreakdown}
          onChange={(budgetBreakdown) => onChange({ ...data, budgetBreakdown })}
        />
      </motion.div>
    </motion.div>
  );
}
