import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Check, X } from 'lucide-react';
import type { BudgetChange } from '@/types/budgetConstraints';
import { CATEGORY_LABELS } from '@/types/budgetConstraints';

interface ComparisonViewProps {
  changes: BudgetChange[];
  totalBudget: number;
  isVisible: boolean;
}

export function ComparisonView({ changes, totalBudget, isVisible }: ComparisonViewProps) {
  if (!isVisible || changes.length === 0) return null;

  // Calculate net changes
  const netChange = changes.reduce((sum, change) => sum + change.delta, 0);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        className="overflow-hidden"
      >
        <div className="rounded-xl bg-card border border-border p-4">
          <h4 className="text-sm font-medium text-foreground mb-3">
            Recent Adjustments
          </h4>

          <div className="space-y-2">
            {changes.slice(0, 5).map((change, index) => (
              <motion.div
                key={`${change.category}-${index}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between text-sm py-1.5 border-b border-border/50 last:border-0"
              >
                <span className="text-muted-foreground">
                  {CATEGORY_LABELS[change.category]}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">
                    ${change.oldValue.toLocaleString()}
                  </span>
                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  <span className="font-medium text-foreground">
                    ${change.newValue.toLocaleString()}
                  </span>
                  <span
                    className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                      change.delta < 0
                        ? 'bg-success/10 text-success'
                        : 'bg-primary/10 text-primary'
                    }`}
                  >
                    {change.delta > 0 ? '+' : ''}
                    ${change.delta.toLocaleString()}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Summary */}
          <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Budget Status</span>
            <div className="flex items-center gap-2">
              {Math.abs(netChange) < 1 ? (
                <>
                  <Check className="h-4 w-4 text-success" />
                  <span className="text-sm font-medium text-success">Balanced</span>
                </>
              ) : (
                <>
                  <X className="h-4 w-4 text-warning" />
                  <span className="text-sm font-medium text-warning">
                    {netChange > 0 ? '+' : ''}${netChange.toLocaleString()} adjustment
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
