import { motion } from 'framer-motion';
import { Plane, Clock, ArrowRight, Check } from 'lucide-react';
import { Flight } from '@/types/travel';
import { Button } from '@/components/ui/button';

interface FlightCardProps {
  flight: Flight;
  isSelected: boolean;
  onSelect: (flight: Flight) => void;
  type: 'outbound' | 'return';
}

export function FlightCard({ flight, isSelected, onSelect, type }: FlightCardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className={`relative bg-card rounded-xl p-4 shadow-md border-2 transition-colors ${
        isSelected ? 'border-primary shadow-glow' : 'border-transparent hover:border-primary/30'
      }`}
    >
      {isSelected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full p-1"
        >
          <Check className="h-4 w-4" />
        </motion.div>
      )}

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="bg-primary/10 p-2 rounded-lg">
            <Plane className={`h-4 w-4 text-primary ${type === 'return' ? 'rotate-180' : ''}`} />
          </div>
          <span className="font-medium text-foreground">{flight.airline}</span>
        </div>
        <span className="text-xs text-muted-foreground capitalize">{type} Flight</span>
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
          <p className="text-xs text-muted-foreground mt-1">
            {flight.stops === 0 ? 'Direct' : `${flight.stops} stop${flight.stops > 1 ? 's' : ''}`}
          </p>
        </div>

        <div className="text-center">
          <p className="text-2xl font-display font-bold text-foreground">{flight.arrivalTime}</p>
          <p className="text-sm text-muted-foreground">{flight.arrival.airport}</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <p className="text-2xl font-display font-bold text-primary">${flight.price}</p>
          <p className="text-xs text-muted-foreground">per person</p>
        </div>
        <Button
          variant={isSelected ? "secondary" : "default"}
          onClick={() => onSelect(flight)}
        >
          {isSelected ? 'Selected' : 'Select'}
        </Button>
      </div>
    </motion.div>
  );
}
