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

export function BudgetPanel({ days, totalBudget, budgetBreakdown }: BudgetPanelProps) {
  // Calculate totals
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

  const remaining = totalBudget - totalSpent;
  const percentageSpent = Math.round((totalSpent / totalBudget) * 100);
  const isOverBudget = totalSpent > totalBudget;

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
            <p className="text-xs text-muted-foreground">Across all days</p>
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
            ${totalSpent.toLocaleString()} / ${totalBudget.toLocaleString()}
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
          const allocated = Math.round((totalBudget * (budgetBreakdown[key] || 20)) / 100);
          const percentage = allocated > 0 ? Math.round((spent / allocated) * 100) : 0;
          const isOver = spent > allocated;
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
                <span className={cn('font-medium', isOver && 'text-destructive')}>
                  ${spent} / ${allocated}
                </span>
              </div>
              <Progress 
                value={Math.min(percentage, 100)} 
                className={cn('h-1.5', isOver && '[&>div]:bg-destructive')}
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

      {/* Savings Tip */}
      {!isOverBudget && remaining > 100 && (
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
      )}
    </motion.div>
  );
}
