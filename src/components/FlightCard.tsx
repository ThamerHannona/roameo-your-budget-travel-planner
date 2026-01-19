import { motion } from 'framer-motion';
import { Plane, Clock, ArrowRight, Check, Plus, X } from 'lucide-react';
import { Flight } from '@/types/travel';
import { Button } from '@/components/ui/button';

interface FlightCardProps {
  flight: Flight;
  isAdded: boolean;
  onAdd: (flight: Flight) => void;
  type: 'outbound' | 'return';
  budgetExceeded?: boolean;
}

export function FlightCard({ flight, isAdded, onAdd, type, budgetExceeded = false }: FlightCardProps) {
  const isDisabled = budgetExceeded && !isAdded;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, boxShadow: '0 12px 24px -8px hsl(var(--primary) / 0.15)' }}
      className={`relative bg-card rounded-xl p-4 shadow-md border-2 transition-all duration-200 ${
        isAdded 
          ? 'border-primary shadow-glow' 
          : isDisabled 
            ? 'border-transparent opacity-60' 
            : 'border-transparent hover:border-primary/30 hover:shadow-lg'
      }`}
    >
      {isAdded && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full p-1"
        >
          <Check className="h-4 w-4" />
        </motion.div>
      )}

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          {/* Airline Logo Placeholder */}
          <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
            <Plane className={`h-5 w-5 text-muted-foreground ${type === 'return' ? 'rotate-180' : ''}`} />
          </div>
          <div>
            <span className="font-medium text-foreground block">{flight.airline}</span>
            <span className="text-xs text-muted-foreground capitalize">{type} Flight</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="text-center">
          <p className="text-2xl font-display font-bold text-foreground">{flight.departureTime}</p>
          <p className="text-sm text-muted-foreground">{flight.departure.airport}</p>
        </div>
        
        <div className="flex-1 mx-4 flex flex-col items-center">
          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
            <Clock className="h-3 w-3" />
            <span>{flight.duration}</span>
          </div>
          <div className="w-full flex items-center">
            <div className="h-px flex-1 bg-border" />
            <ArrowRight className="h-4 w-4 text-primary mx-2" />
            <div className="h-px flex-1 bg-border" />
          </div>
          <p className="text-xs text-muted-foreground mt-1 font-medium">
            {flight.stops === 0 ? 'Nonstop' : `${flight.stops} stop${flight.stops > 1 ? 's' : ''}`}
          </p>
        </div>

        <div className="text-center">
          <p className="text-2xl font-display font-bold text-foreground">{flight.arrivalTime}</p>
          <p className="text-sm text-muted-foreground">{flight.arrival.airport}</p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-border">
        <div>
          <p className="text-2xl font-display font-bold text-primary">${flight.price}</p>
          <p className="text-xs text-muted-foreground">per person</p>
        </div>
        <Button
          variant={isAdded ? "destructive" : "default"}
          onClick={() => onAdd(flight)}
          disabled={isDisabled}
          className="gap-2"
        >
          {isAdded ? (
            <>
              <X className="h-4 w-4" />
              Remove
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              Add to Trip
            </>
          )}
        </Button>
      </div>

      {isDisabled && (
        <p className="text-xs text-destructive mt-2 text-center">Exceeds budget</p>
      )}
    </motion.div>
  );
}