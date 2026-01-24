import { motion } from 'framer-motion';
import { Plane, Clock, ExternalLink, Check, MapPin, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { FlightOption } from '@/services/serpapi';

interface FlightOptionsCardProps {
  options: FlightOption[];
  selectedTier: 'budget' | 'mid' | 'premium';
  onSelectTier: (tier: 'budget' | 'mid' | 'premium') => void;
  budgetFlight?: FlightOption;
  className?: string;
}

const tierLabels: Record<'budget' | 'mid' | 'premium', string> = {
  budget: 'Budget Option',
  mid: 'Recommended',
  premium: 'Direct Flight',
};

const tierDescriptions: Record<'budget' | 'mid' | 'premium', string> = {
  budget: 'Lowest price, may have longer layovers',
  mid: 'Best balance of price and comfort',
  premium: 'Fastest route, fewer/no stops',
};

export function FlightOptionsCard({
  options,
  selectedTier,
  onSelectTier,
  className,
}: FlightOptionsCardProps) {
  if (!options.length) {
    return (
      <div className={cn("p-4 bg-muted/50 rounded-lg text-center", className)}>
        <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">No flight data available</p>
      </div>
    );
  }

  const getFlightByTier = (tier: 'budget' | 'mid' | 'premium'): FlightOption | undefined => {
    return options.find(o => o.tier === tier);
  };

  const budgetFlight = getFlightByTier('budget');
  const selectedFlight = getFlightByTier(selectedTier) || options[0];

  const calculateSavings = (flight: FlightOption): number | null => {
    if (!budgetFlight || flight.tier === 'budget') return null;
    return flight.price - budgetFlight.price;
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center gap-2 mb-4">
        <Plane className="h-5 w-5 text-primary" />
        <h3 className="font-display font-semibold text-lg">Choose Your Flight</h3>
      </div>

      {options.map((flight, index) => {
        const isSelected = flight.tier === selectedTier;
        const savings = calculateSavings(flight);

        return (
          <motion.button
            key={flight.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => onSelectTier(flight.tier)}
            className={cn(
              "w-full p-4 rounded-xl border-2 text-left transition-all",
              "hover:shadow-md hover:border-primary/50",
              isSelected 
                ? "border-primary bg-primary/5 shadow-sm" 
                : "border-border bg-card"
            )}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-2">
                {/* Tier label and badge */}
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-4 h-4 rounded-full border-2 flex items-center justify-center",
                    isSelected ? "border-primary bg-primary" : "border-muted-foreground"
                  )}>
                    {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                  </div>
                  <span className="font-medium">{tierLabels[flight.tier]}</span>
                  {flight.tier === 'mid' && (
                    <Badge variant="secondary" className="text-xs">Best Value</Badge>
                  )}
                  {flight.layovers === 0 && (
                    <Badge className="text-xs bg-green-500/10 text-green-600 border-green-500/20">
                      Nonstop
                    </Badge>
                  )}
                </div>

                {/* Airline and flight number */}
                <div className="flex items-center gap-2 text-sm">
                  {flight.airlineLogo && (
                    <img 
                      src={flight.airlineLogo} 
                      alt={flight.airline} 
                      className="h-5 w-auto"
                    />
                  )}
                  <span className="font-medium text-foreground">{flight.airline}</span>
                  <span className="text-muted-foreground">• {flight.flightNumber}</span>
                </div>

                {/* Route and timing */}
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span>{flight.departure.airport}</span>
                  <span className="text-xs">{flight.departure.time}</span>
                  <span>→</span>
                  <span>{flight.arrival.airport}</span>
                  <span className="text-xs">{flight.arrival.time}</span>
                </div>

                {/* Duration and layovers */}
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{flight.duration}</span>
                  </div>
                  {flight.layovers > 0 && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      <span>
                        {flight.layovers} stop{flight.layovers > 1 ? 's' : ''}
                        {flight.layoverCities.length > 0 && ` in ${flight.layoverCities[0]}`}
                        {flight.layoverDuration && ` (${flight.layoverDuration})`}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Price */}
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">
                  ${flight.price.toLocaleString()}
                </div>
                {savings && savings > 0 && (
                  <div className="text-xs text-muted-foreground">
                    +${savings} vs budget
                  </div>
                )}
                {isSelected && (
                  <div className="flex items-center justify-end gap-1 mt-1 text-xs text-green-600">
                    <Check className="h-3 w-3" />
                    Selected
                  </div>
                )}
              </div>
            </div>

            {/* Booking link */}
            <div className="mt-3 pt-3 border-t border-border/50">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground hover:text-primary"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(flight.bookingUrl, '_blank');
                }}
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                View on Google Flights
              </Button>
            </div>
          </motion.button>
        );
      })}

      {/* Savings comparison */}
      {options.length >= 2 && budgetFlight && (
        <div className="p-3 bg-muted/30 rounded-lg text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>💡</span>
            <span>
              Choosing the budget option saves 
              <span className="font-semibold text-foreground mx-1">
                ${((options.find(o => o.tier === 'premium')?.price || budgetFlight.price) - budgetFlight.price).toLocaleString()}
              </span>
              for more activities
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default FlightOptionsCard;
