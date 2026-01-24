import { motion, AnimatePresence } from 'framer-motion';
import { Plane, Check, Clock, ArrowUpRight, Sparkles, TrendingDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { FlightOption } from '@/types/budgetConstraints';

interface FlightTierSelectorProps {
  options: FlightOption[];
  selectedPrice: number;
  onSelect: (price: number) => void;
  totalBudget: number;
}

const tierConfig: Record<string, { label: string; badge: string; color: string }> = {
  budget: {
    label: 'Budget',
    badge: 'Best Value',
    color: 'bg-success/10 text-success border-success/20',
  },
  mid: {
    label: 'Recommended',
    badge: 'Popular',
    color: 'bg-primary/10 text-primary border-primary/20',
  },
  premium: {
    label: 'Premium',
    badge: 'Direct Flight',
    color: 'bg-warning/10 text-warning border-warning/20',
  },
};

export function FlightTierSelector({
  options,
  selectedPrice,
  onSelect,
  totalBudget,
}: FlightTierSelectorProps) {
  if (options.length === 0) {
    return (
      <div className="rounded-xl bg-muted/50 border border-border p-6 text-center">
        <Plane className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">No flight options available</p>
      </div>
    );
  }

  // Categorize flights into tiers
  const sortedOptions = [...options].sort((a, b) => a.price - b.price);
  const categorizedFlights = sortedOptions.map((flight, index) => {
    let tier: 'budget' | 'mid' | 'premium' = 'mid';
    if (index === 0) tier = 'budget';
    else if (index === sortedOptions.length - 1) tier = 'premium';
    else tier = 'mid';
    return { ...flight, tier };
  });

  const budgetFlight = categorizedFlights.find(f => f.tier === 'budget');
  const selectedFlight = categorizedFlights.find(f => f.price === selectedPrice);

  const calculateSavings = (price: number): number | null => {
    if (!budgetFlight) return null;
    const diff = price - budgetFlight.price;
    return diff > 0 ? diff : null;
  };

  const calculateBudgetImpact = (price: number): string => {
    const percentage = ((price / totalBudget) * 100).toFixed(0);
    return `${percentage}% of budget`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Plane className="h-5 w-5 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Choose Your Flight</h3>
        </div>
        <Badge variant="outline" className="text-xs">
          {options.length} options
        </Badge>
      </div>

      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {categorizedFlights.map((flight, index) => {
            const isSelected = flight.price === selectedPrice;
            const config = tierConfig[flight.tier];
            const savings = calculateSavings(flight.price);
            const budgetImpact = calculateBudgetImpact(flight.price);

            return (
              <motion.div
                key={flight.flightNumber || index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => onSelect(flight.price)}
                className={cn(
                  'relative rounded-xl border-2 p-4 cursor-pointer transition-all duration-200',
                  isSelected
                    ? 'border-primary bg-primary/5 shadow-md'
                    : 'border-border bg-card hover:border-primary/40 hover:shadow-sm'
                )}
              >
                {/* Selection indicator */}
                <div className={cn(
                  'absolute top-4 right-4 h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all',
                  isSelected
                    ? 'border-primary bg-primary'
                    : 'border-muted-foreground/30'
                )}>
                  {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                </div>

                {/* Tier badge */}
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="outline" className={cn('text-xs font-medium', config.color)}>
                    {config.label}
                  </Badge>
                  {flight.tier === 'budget' && (
                    <Badge className="bg-success text-success-foreground text-xs">
                      <TrendingDown className="h-3 w-3 mr-1" />
                      Best Price
                    </Badge>
                  )}
                  {flight.direct && (
                    <Badge className="bg-warning/10 text-warning text-xs border border-warning/20">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Direct
                    </Badge>
                  )}
                </div>

                {/* Flight details */}
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <p className="font-semibold text-foreground">
                      {flight.airline} • {flight.flightNumber}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{flight.duration}</span>
                      {flight.stops > 0 && (
                        <>
                          <span className="text-border">•</span>
                          <span>{flight.stops} stop{flight.stops > 1 ? 's' : ''}</span>
                          {flight.layover && (
                            <span className="text-muted-foreground/70">
                              ({flight.layover})
                            </span>
                          )}
                        </>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{budgetImpact}</p>
                  </div>

                  {/* Price */}
                  <div className="text-right">
                    <p className="text-xl font-bold text-foreground">
                      ${flight.price.toLocaleString()}
                    </p>
                    {savings && (
                      <p className="text-xs text-muted-foreground">
                        +${savings} vs budget
                      </p>
                    )}
                  </div>
                </div>

                {/* Trade-off hint for selected */}
                {isSelected && savings && flight.tier !== 'budget' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-3 pt-3 border-t border-border"
                  >
                    <p className="text-xs text-muted-foreground">
                      💡 Choosing budget flight saves ${savings} → could add {Math.floor(savings / 50)} more activities
                    </p>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Book on Google Flights */}
      {selectedFlight && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={(e) => {
              e.stopPropagation();
              // Construct Google Flights URL
              window.open(
                `https://www.google.com/travel/flights`,
                '_blank',
                'noopener,noreferrer'
              );
            }}
          >
            <ArrowUpRight className="h-4 w-4 mr-2" />
            View on Google Flights
          </Button>
        </motion.div>
      )}
    </div>
  );
}

export default FlightTierSelector;
