import { motion } from 'framer-motion';
import { Plane, Clock, ArrowRight, Check, Plus, X } from 'lucide-react';
import { Flight } from '@/types/travel';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface FlightCardProps {
  flight: Flight;
  isAdded: boolean;
  onAdd: (flight: Flight) => void;
  type: 'outbound' | 'return';
  budgetExceeded?: boolean;
}

export function FlightCard({ flight, isAdded, onAdd, type, budgetExceeded = false }: FlightCardProps) {
  const { toast } = useToast();
  const isDisabled = budgetExceeded && !isAdded;

  const handleClick = () => {
    onAdd(flight);
    
    if (isAdded) {
      toast({
        title: "Flight removed",
        description: `${flight.airline} ${type} flight removed from your trip.`,
      });
    } else {
      toast({
        title: "Flight added",
        description: `${flight.airline} ${type} flight added to your trip.`,
      });
    }
  };

  return (
    <motion.article
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
      role="listitem"
      aria-label={`${flight.airline} ${type} flight from ${flight.departure.airport} to ${flight.arrival.airport}, $${flight.price}`}
    >
      {isAdded && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full p-1"
          aria-hidden="true"
        >
          <Check className="h-4 w-4" />
        </motion.div>
      )}

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          {/* Airline Logo Placeholder */}
          <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center overflow-hidden" aria-hidden="true">
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
        
        <div className="flex-1 mx-4 flex flex-col items-center" aria-hidden="true">
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
          onClick={handleClick}
          disabled={isDisabled}
          className="gap-2 transition-transform focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label={isAdded ? `Remove ${flight.airline} flight` : `Add ${flight.airline} flight to trip`}
        >
          {isAdded ? (
            <>
              <X className="h-4 w-4" aria-hidden="true" />
              Remove
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add to Trip
            </>
          )}
        </Button>
      </div>

      {isDisabled && (
        <p className="text-xs text-destructive mt-2 text-center" role="alert">
          Exceeds budget
        </p>
      )}
    </motion.article>
  );
}