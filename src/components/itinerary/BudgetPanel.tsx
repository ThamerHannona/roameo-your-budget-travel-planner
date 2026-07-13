import { motion } from 'framer-motion';
import { DollarSign, AlertTriangle, TrendingUp, Plane, Building2, Utensils, Ticket, Bus } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import type { DayPlan } from '@/types/itinerary';
import { getDayTotals } from '@/data/lisbonItinerary';
import { cn } from '@/lib/utils';

interface BudgetPanelProps {
  days: DayPlan[];
  totalBudget: number;
  budgetBreakdown: Record<string, number>;
}

const categoryConfig: Record<string, { icon: typeof DollarSign; color: string; label: string }> = {
  flights: { icon: Plane, color: 'bg-sky-500', label: 'Flights' },
  accommodation: { icon: Building2, color: 'bg-violet-500', label: 'Hotels' },
  activities: { icon: Ticket, color: 'bg-emerald-500', label: 'Activities' },
  food: { icon: Utensils, color: 'bg-amber-500', label: 'Food' },
  transportation: { icon: Bus, color: 'bg-slate-500', label: 'Transport' },
};

// Categories that scale with trip length (per-day/per-night spend).
// Flights and the total hotel bill are already trip totals from the sliders,
// so we don't multiply those by nights.
const PER_NIGHT_CATEGORIES = new Set(['activities', 'food', 'transportation']);

export function BudgetPanel({ days, totalBudget, budgetBreakdown }: BudgetPanelProps) {
  // Real nights = number of itinerary days (used to scale per-day caps so they
  // are comparable to itinerary-derived spend across the whole trip).
  const realNights = Math.max(1, days.length);

  const categorySpent: Record<string, number> = {
    flights: 0,
    accommodation: 0,
    activities: 0,
    food: 0,
    transportation: 0,
  };

  let totalSpent = 0;
  const dayOverspending: number[] = [];

  days.forEach((day) => {
    const { spent, remaining } = getDayTotals(day);
    totalSpent += spent;
    if (remaining < 0) {
      dayOverspending.push(day.dayNumber);
    }

    day.activities.forEach((activity) => {
      switch (activity.type) {
        case 'flight':
          categorySpent.flights += activity.cost;
          break;
        case 'hotel':
          categorySpent.accommodation += activity.cost;
          break;
        case 'restaurant':
          categorySpent.food += activity.cost;
          break;
        case 'transport':
          categorySpent.transportation += activity.cost;
          break;
        default:
          categorySpent.activities += activity.cost;
      }
    });
  });

  // Compute per-category allocated caps, scaled to trip length for
  // per-day categories so caps and itinerary-derived spend are comparable.
  const categoryAllocated: Record<string, number> = {};
  Object.keys(categoryConfig).forEach((key) => {
    const base = Math.round((totalBudget * (budgetBreakdown[key] || 20)) / 100);
    categoryAllocated[key] = PER_NIGHT_CATEGORIES.has(key) ? base * realNights : base;
  });

  const totalAllocated = Object.values(categoryAllocated).reduce((s, v) => s + v, 0);
  const remaining = totalAllocated - totalSpent;
  const percentageSpent = totalAllocated > 0 ? Math.round((totalSpent / totalAllocated) * 100) : 0;
  const isOverBudget = totalSpent > totalAllocated;

  const categoriesOver = Object.keys(categoryConfig).filter(
    (key) => categorySpent[key] > categoryAllocated[key],
  );
  const hasCategoryOver = categoriesOver.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-xl p-4 shadow-sm"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary/10 rounded-lg">
            <DollarSign className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Trip Budget</h3>
            <p className="text-xs text-muted-foreground">Across {realNights} day{realNights === 1 ? '' : 's'}</p>
          </div>
        </div>
        <Badge variant={isOverBudget ? 'destructive' : 'default'} className={cn(!isOverBudget && 'bg-success')}>
          {isOverBudget ? 'Over Budget' : 'On Track'}
        </Badge>
      </div>

      {/* Total Progress */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-muted-foreground">Total Spent</span>
          <span className="font-medium">
            ${totalSpent.toLocaleString()} / ${totalAllocated.toLocaleString()}
          </span>
        </div>
        <Progress
          value={Math.min(percentageSpent, 100)}
          className={cn('h-3', isOverBudget && '[&>div]:bg-destructive')}
        />
        <div className="flex justify-between text-xs mt-1">
          <span className={cn(isOverBudget ? 'text-destructive' : 'text-success')}>
            {isOverBudget ? `-$${Math.abs(remaining).toLocaleString()} over` : `$${remaining.toLocaleString()} remaining`}
          </span>
          <span className="text-muted-foreground">{percentageSpent}%</span>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-foreground">By Category</h4>
        {Object.entries(categoryConfig).map(([key, config]) => {
          const spent = categorySpent[key];
          const allocated = categoryAllocated[key];
          const percentage = allocated > 0 ? Math.round((spent / allocated) * 100) : 0;
          const ratio = allocated > 0 ? spent / allocated : 0;
          const isOver = spent > allocated;
          const isAmber = !isOver && ratio >= 0.85;
          const Icon = config.icon;

          return (
            <div key={key} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className={cn('w-6 h-6 rounded flex items-center justify-center text-white', config.color)}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-muted-foreground">{config.label}</span>
                </div>
                <span
                  className={cn(
                    'font-medium',
                    isOver && 'text-destructive',
                    isAmber && 'text-warning',
                    !isOver && !isAmber && 'text-success',
                  )}
                >
                  ${spent.toLocaleString()} / ${allocated.toLocaleString()}
                </span>
              </div>
              <Progress
                value={Math.min(percentage, 100)}
                className={cn(
                  'h-1.5',
                  isOver && '[&>div]:bg-destructive',
                  isAmber && '[&>div]:bg-warning',
                )}
              />
            </div>
          );
        })}
      </div>

      {/* Overspending Alert */}
      {dayOverspending.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-2"
        >
          <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="font-medium text-destructive">Overspending detected</p>
            <p className="text-destructive/80">
              Day{dayOverspending.length > 1 ? 's' : ''} {dayOverspending.join(', ')} exceed daily budget
            </p>
          </div>
        </motion.div>
      )}

      {/* Category status footer: warn when any category is over, even if the
          overall total is still within budget. Only celebrate when everything
          is clean and there's real headroom. */}
      {hasCategoryOver ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-4 p-3 bg-warning/10 border border-warning/20 rounded-lg flex items-start gap-2"
        >
          <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="font-medium text-warning">Some categories are over their cap</p>
            <p className="text-warning/80">
              {categoriesOver
                .map((k) => categoryConfig[k].label)
                .join(', ')}{' '}
              exceeded — adjust your allocation on the Customize page to rebalance.
            </p>
          </div>
        </motion.div>
      ) : (
        !isOverBudget &&
        remaining > 100 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-4 p-3 bg-success/10 border border-success/20 rounded-lg flex items-start gap-2"
          >
            <TrendingUp className="h-4 w-4 text-success shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-medium text-success">Looking good!</p>
              <p className="text-success/80">
                You have ${remaining.toLocaleString()} buffer for extras or emergencies
              </p>
            </div>
          </motion.div>
        )
      )}
    </motion.div>
  );
}
