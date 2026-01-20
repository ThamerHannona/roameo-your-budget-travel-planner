import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, TrendingUp } from 'lucide-react';
import { getExampleDestinations, getBudgetPerDay } from '@/stores/tripSearchStore';

interface BudgetPreviewProps {
  budget: number;
  days: number;
}

export function BudgetPreview({ budget, days }: BudgetPreviewProps) {
  const budgetPerDay = getBudgetPerDay(budget, days);
  const destinations = getExampleDestinations(budget, days);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 rounded-2xl p-6 border border-primary/20"
    >
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
          <TrendingUp className="h-5 w-5 text-primary" />
        </div>
        
        <div className="flex-1">
          <p className="text-sm text-muted-foreground mb-2">
            With <span className="font-bold text-foreground">${budget.toLocaleString()}</span> for{' '}
            <span className="font-bold text-foreground">{days} days</span>, you could visit:
          </p>
          
          <AnimatePresence mode="wait">
            <motion.div
              key={destinations.join('-')}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="flex flex-wrap gap-2"
            >
              {destinations.map((dest, index) => (
                <motion.span
                  key={dest}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="inline-flex items-center gap-1.5 bg-card px-3 py-1.5 rounded-full border border-border text-sm font-medium"
                >
                  <MapPin className="h-3 w-3 text-primary" />
                  {dest}
                </motion.span>
              ))}
            </motion.div>
          </AnimatePresence>
          
          <p className="text-xs text-muted-foreground mt-3">
            That's about <span className="font-semibold text-primary">${budgetPerDay}/day</span> for flights, hotels, activities, and food
          </p>
        </div>
      </div>
    </motion.div>
  );
}
