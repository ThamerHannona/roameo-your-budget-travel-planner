import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { SavingsHighlight } from '@/types/dateFlexibility';

interface SavingsHighlightsProps {
  highlights: SavingsHighlight[];
  onHighlightClick?: (highlight: SavingsHighlight) => void;
}

const highlightStyles: Record<SavingsHighlight['type'], string> = {
  'best-deal': 'bg-success/10 border-success/30 hover:bg-success/20',
  'avoid': 'bg-destructive/10 border-destructive/30 hover:bg-destructive/20',
  'average': 'bg-muted border-border hover:bg-muted/80',
  'tip': 'bg-primary/10 border-primary/30 hover:bg-primary/20',
};

export function SavingsHighlights({ highlights, onHighlightClick }: SavingsHighlightsProps) {
  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-foreground text-sm">Savings Insights</h3>
      
      <div className="space-y-2">
        {highlights.map((highlight, index) => (
          <motion.button
            key={index}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => highlight.dateRange && onHighlightClick?.(highlight)}
            disabled={!highlight.dateRange}
            className={cn(
              'w-full p-3 rounded-lg border text-left transition-all',
              highlightStyles[highlight.type],
              highlight.dateRange && 'cursor-pointer'
            )}
          >
            <div className="flex items-start gap-2">
              <span className="text-lg">{highlight.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground text-sm leading-tight">
                  {highlight.title}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {highlight.description}
                </p>
                {highlight.dateRange && (
                  <p className="text-xs text-primary mt-1">
                    Click to select dates →
                  </p>
                )}
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
