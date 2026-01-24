import { motion } from 'framer-motion';
import { Lock, Calendar, DollarSign } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { PaywallDayItinerary } from '@/types/paywall';

interface LockedDayCardProps {
  day: PaywallDayItinerary;
  onClick: () => void;
}

export function LockedDayCard({ day, onClick }: LockedDayCardProps) {
  // Generate blurred preview hints
  const previewHints = day.activities.slice(0, 4).map(a => ({
    time: a.time,
    hint: a.genericTitle.split(' ').slice(0, 3).join(' ') + '...'
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: day.dayNumber * 0.1 }}
    >
      <Card 
        className="relative overflow-hidden border-2 border-dashed border-muted-foreground/30 bg-gradient-to-b from-muted/30 to-muted/60 cursor-pointer hover:border-primary/50 transition-colors"
        onClick={onClick}
      >
        {/* Blurred background content */}
        <div className="absolute inset-0 p-6 opacity-20 blur-sm pointer-events-none">
          {previewHints.map((hint, idx) => (
            <div key={idx} className="flex items-center gap-3 py-2 text-muted-foreground">
              <span className="text-sm font-medium">{hint.time}</span>
              <span className="text-sm">•</span>
              <span className="text-sm">{hint.hint}</span>
            </div>
          ))}
        </div>

        <CardContent className="relative z-10 py-12 text-center">
          {/* Day header info */}
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              {day.date}
            </div>
            {day.weather && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <span>{day.weather.icon}</span>
                <span>{day.weather.temp}°F</span>
              </div>
            )}
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <DollarSign className="h-4 w-4" />
              ${day.totalSpent}
            </div>
          </div>

          {/* Lock icon */}
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-muted"
          >
            <Lock className="h-8 w-8 text-muted-foreground" />
          </motion.div>

          {/* Locked text */}
          <h3 className="text-lg font-display font-bold text-foreground mb-2">
            Day {day.dayNumber} - LOCKED
          </h3>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            {day.activities.length} activities planned • Unlock to reveal specific names, addresses & booking links
          </p>

          {/* Unlock button hint */}
          <motion.div
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Lock className="h-4 w-4" />
            Click to unlock full itinerary
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
