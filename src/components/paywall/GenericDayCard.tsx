import { motion } from 'framer-motion';
import { Calendar, DollarSign, Lightbulb, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GenericActivityCard } from './GenericActivityCard';
import type { PaywallDayItinerary } from '@/types/paywall';
import { cn } from '@/lib/utils';

interface GenericDayCardProps {
  day: PaywallDayItinerary;
  isPaid: boolean;
}

export function GenericDayCard({ day, isPaid }: GenericDayCardProps) {
  const [showProTips, setShowProTips] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: day.dayNumber * 0.1 }}
    >
      <Card className="overflow-hidden border-border/50 shadow-sm hover:shadow-md transition-shadow">
        {/* Header */}
        <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold">
                {day.dayNumber}
              </div>
              <div>
                <h3 className="font-display font-bold text-lg text-foreground">
                  Day {day.dayNumber}
                </h3>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {day.date}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {day.weather && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <span className="text-lg">{day.weather.icon}</span>
                  <span>{day.weather.temp}°F</span>
                </div>
              )}
              <div className="flex items-center gap-1 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 px-3 py-1 rounded-full">
                <DollarSign className="h-4 w-4" />
                <span className="font-semibold">${day.totalSpent}</span>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 space-y-2">
          {/* Activities */}
          {day.activities.map((activity, index) => (
            <GenericActivityCard
              key={activity.id}
              activity={activity}
              isPaid={isPaid}
              index={index}
            />
          ))}

          {/* Pro Tips */}
          {day.proTips && day.proTips.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border/50">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowProTips(!showProTips)}
                className="w-full justify-between text-muted-foreground hover:text-foreground"
              >
                <span className="flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-amber-500" />
                  Pro Tips for Day {day.dayNumber}
                </span>
                {showProTips ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
              
              {showProTips && (
                <motion.ul
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-2 space-y-2 pl-2"
                >
                  {day.proTips.map((tip, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2 text-sm p-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-200"
                    >
                      <span className="text-amber-500">•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </motion.ul>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
