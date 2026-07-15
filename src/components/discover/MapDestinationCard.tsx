import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { X, Plane, Hotel, MapPin, TrendingUp, Star, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DestinationMatch } from '@/types/destination';
import { useSelectedDestinationStore } from '@/stores/selectedDestinationStore';

interface MapDestinationCardProps {
  destination: DestinationMatch;
  onClose: () => void;
  onSelect: () => void;
}

export function MapDestinationCard({
  destination,
  onClose,
  onSelect,
}: MapDestinationCardProps) {
  const navigate = useNavigate();
  const setDestination = useSelectedDestinationStore((s) => s.setDestination);
  const savingsPercent = Math.round((destination.budgetDelta / destination.estimatedTotalCost) * 100);

  const goToSection = (hash: 'flights-section' | 'hotels-section') => {
    setDestination(destination);
    navigate(`/trip/${destination.id}/budget#${hash}`);
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, x: 20, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 20, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="absolute top-4 right-20 z-[1000] w-80 bg-card border border-border rounded-xl overflow-hidden shadow-2xl"
    >
      {/* Image Header */}
      <div className="relative h-32">
        <img
          src={destination.imageUrl}
          alt={destination.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        
        {/* Close button */}
        <Button
          size="icon"
          variant="ghost"
          className="absolute top-2 right-2 h-8 w-8 bg-black/40 hover:bg-black/60 text-white"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
        
        {/* City name */}
        <div className="absolute bottom-3 left-3">
          <h3 className="text-xl font-bold text-white">{destination.name}</h3>
          <div className="flex items-center gap-1 text-white/80 text-sm">
            <MapPin className="h-3 w-3" />
            <span>{destination.country}</span>
            <span className="ml-1">{destination.flagEmoji}</span>
          </div>
        </div>
        
        {/* Value badge */}
        {savingsPercent > 0 && (
          <Badge className="absolute top-2 left-2 bg-green-500/90 text-white">
            <TrendingUp className="h-3 w-3 mr-1" />
            {savingsPercent}% under budget
          </Badge>
        )}
      </div>
      
      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Price breakdown — click to open live flight/hotel results */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => goToSection('flights-section')}
            className="group flex items-center gap-2 rounded-lg border border-border/60 p-2 text-left text-sm transition-colors hover:border-primary hover:bg-primary/5"
            aria-label="View flight results for this destination"
          >
            <div className="p-1.5 rounded-lg bg-primary/10">
              <Plane className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                Flights
                <ArrowRight className="h-3 w-3 opacity-0 -translate-x-1 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
              </p>
              <p className="font-semibold">from ${destination.flightCost.toLocaleString()}</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => goToSection('hotels-section')}
            className="group flex items-center gap-2 rounded-lg border border-border/60 p-2 text-left text-sm transition-colors hover:border-primary hover:bg-primary/5"
            aria-label="View hotel results for this destination"
          >
            <div className="p-1.5 rounded-lg bg-primary/10">
              <Hotel className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                Hotels
                <ArrowRight className="h-3 w-3 opacity-0 -translate-x-1 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
              </p>
              <p className="font-semibold">from ${destination.accommodationCost.toLocaleString()}</p>
            </div>
          </button>
        </div>
        
        {/* Total */}
        <div className="flex items-center justify-between py-3 border-t border-border">
          <div>
            <p className="text-xs text-muted-foreground">Estimated Total</p>
            <p className="text-2xl font-bold text-primary">
              ${destination.estimatedTotalCost.toLocaleString()}
            </p>
          </div>
          
          <div className="text-right">
            <div className="flex items-center gap-1 text-sm">
              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
              <span className="font-medium">{destination.confidenceScore}%</span>
            </div>
            <p className="text-xs text-muted-foreground">Match score</p>
          </div>
        </div>
        
        {/* Why this works */}
        <p className="text-sm text-muted-foreground italic">
          "{destination.whyThisWorks}"
        </p>
        
        {/* CTA */}
        <Button 
          className="w-full" 
          size="lg"
          onClick={onSelect}
        >
          Select Destination
        </Button>
      </div>
    </motion.div>
  );
}
