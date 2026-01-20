import { motion, AnimatePresence } from 'framer-motion';
import { Scale, X, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DestinationMatch } from '@/types/destination';

interface StickyComparisonBarProps {
  destinations: DestinationMatch[];
  onRemove: (id: string) => void;
  onCompare: () => void;
  maxItems?: number;
}

export function StickyComparisonBar({
  destinations,
  onRemove,
  onCompare,
  maxItems = 3,
}: StickyComparisonBarProps) {
  if (destinations.length === 0) return null;

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t border-border shadow-lg"
    >
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Selected destinations */}
          <div className="flex items-center gap-3 overflow-x-auto">
            <div className="flex items-center gap-2 text-sm text-muted-foreground shrink-0">
              <Scale className="h-4 w-4" />
              <span className="hidden sm:inline">Comparing:</span>
            </div>
            
            <div className="flex items-center gap-2">
              <AnimatePresence mode="popLayout">
                {destinations.map((dest) => (
                  <motion.div
                    key={dest.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex items-center gap-2 bg-primary/10 text-primary rounded-full pl-3 pr-1.5 py-1.5 shrink-0"
                  >
                    <span className="text-lg">{dest.flagEmoji}</span>
                    <span className="text-sm font-medium">{dest.name}</span>
                    <button
                      onClick={() => onRemove(dest.id)}
                      className="p-0.5 rounded-full hover:bg-primary/20 transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {/* Empty slots */}
              {Array.from({ length: maxItems - destinations.length }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="w-24 h-8 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center shrink-0"
                >
                  <span className="text-xs text-muted-foreground">+ Add</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Compare button */}
          <Button
            onClick={onCompare}
            disabled={destinations.length < 2}
            className="gap-2 shrink-0"
          >
            Compare {destinations.length >= 2 && `(${destinations.length})`}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
