import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { useTravel } from '@/context/TravelContext';

export function BudgetTracker() {
  const { search, getTotalCost, getRemainingBudget } = useTravel();

  if (!search) return null;

  const totalCost = getTotalCost();
  const remaining = getRemainingBudget();
  const percentage = (totalCost / search.budget) * 100;
  const isOverBudget = remaining < 0;
  const isNearLimit = percentage > 80 && !isOverBudget;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-xl p-4 shadow-lg"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-primary" />
          <span className="font-display font-semibold text-foreground">Budget Tracker</span>
        </div>
        <div className={`flex items-center gap-1 text-sm font-medium ${
          isOverBudget ? 'text-destructive' : isNearLimit ? 'text-warning' : 'text-success'
        }`}>
          {isOverBudget ? (
            <TrendingDown className="h-4 w-4" />
          ) : (
            <TrendingUp className="h-4 w-4" />
          )}
          {isOverBudget ? 'Over Budget' : isNearLimit ? 'Near Limit' : 'On Track'}
        </div>
      </div>

      <div className="relative h-3 bg-muted rounded-full overflow-hidden mb-3">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(percentage, 100)}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className={`absolute inset-y-0 left-0 rounded-full ${
            isOverBudget 
              ? 'bg-destructive' 
              : isNearLimit 
                ? 'bg-warning' 
                : 'bg-success'
          }`}
        />
        {isOverBudget && (
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(percentage - 100, 50)}%` }}
            transition={{ duration: 0.5, ease: 'easeOut', delay: 0.3 }}
            className="absolute inset-y-0 right-0 bg-destructive/50 rounded-full"
          />
        )}
      </div>

      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Budget</p>
          <p className="font-display font-bold text-foreground">${search.budget.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Spent</p>
          <p className="font-display font-bold text-primary">${totalCost.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Remaining</p>
          <p className={`font-display font-bold ${isOverBudget ? 'text-destructive' : 'text-success'}`}>
            {isOverBudget ? '-' : ''}${Math.abs(remaining).toLocaleString()}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
