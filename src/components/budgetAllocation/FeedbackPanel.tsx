import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, ArrowRight, TrendingUp, TrendingDown, CheckCircle2 } from 'lucide-react';
import type { BudgetChange } from '@/types/budgetConstraints';
import { CATEGORY_LABELS, CATEGORY_COLORS } from '@/types/budgetConstraints';

interface FeedbackPanelProps {
  changes: BudgetChange[];
}

export function FeedbackPanel({ changes }: FeedbackPanelProps) {
  const latestChange = changes[0];

  if (!latestChange) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="rounded-xl bg-muted/50 border border-border p-4"
      >
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Lightbulb className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="font-medium text-foreground">Drag sliders to customize</p>
            <p className="text-sm text-muted-foreground mt-1">
              Adjust any category to see how it affects your trip. 
              Total budget stays the same!
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  const isSaving = latestChange.delta < 0;
  const categoryLabel = CATEGORY_LABELS[latestChange.category];
  const categoryColor = CATEGORY_COLORS[latestChange.category];

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`${latestChange.category}-${latestChange.newValue}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className={`rounded-xl border p-4 ${
          isSaving 
            ? 'bg-success/5 border-success/20' 
            : 'bg-primary/5 border-primary/20'
        }`}
      >
        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <div 
            className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              isSaving ? 'bg-success/20' : 'bg-primary/20'
            }`}
          >
            {isSaving ? (
              <TrendingDown className="h-4 w-4 text-success" />
            ) : (
              <TrendingUp className="h-4 w-4 text-primary" />
            )}
          </div>
          <div>
            <p className="font-medium text-foreground">
              {latestChange.impact.message}
            </p>
          </div>
        </div>

        {/* Change details */}
        <div className="flex items-center gap-3 mb-4 p-2 bg-background/50 rounded-lg">
          <div className="flex-1">
            <div className="text-sm text-muted-foreground">{categoryLabel}</div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground">
                ${latestChange.oldValue.toLocaleString()}
              </span>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <span 
                className="font-semibold"
                style={{ color: categoryColor }}
              >
                ${latestChange.newValue.toLocaleString()}
              </span>
              <span 
                className={`text-sm font-medium ${
                  isSaving ? 'text-success' : 'text-primary'
                }`}
              >
                ({isSaving ? '' : '+'}${latestChange.delta.toLocaleString()})
              </span>
            </div>
          </div>
        </div>

        {/* Unlocks */}
        {latestChange.impact.unlocks.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-sm font-medium text-foreground">
              {isSaving ? 'This unlocks:' : 'You get:'}
            </p>
            {latestChange.impact.unlocks.map((unlock, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-2 text-sm"
              >
                <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />
                <span className="text-muted-foreground">{unlock}</span>
              </motion.div>
            ))}
          </div>
        )}

        {/* Trade-offs */}
        {latestChange.impact.trades.length > 0 && (
          <div className="mt-3 pt-3 border-t border-border/50">
            <p className="text-xs text-muted-foreground">
              Trade-off: {latestChange.impact.trades.join(', ')}
            </p>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
