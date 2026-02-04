import { motion } from 'framer-motion';
import { X, Plane, Hotel, MapPin, TrendingUp, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DestinationMatch } from '@/types/destination';

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
  const savingsPercent = Math.round((destination.budgetDelta / destination.estimatedTotalCost) * 100);
  
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
        {/* Price breakdown */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 text-sm">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <Plane className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Flights</p>
              <p className="font-semibold">${destination.flightCost.toLocaleString()}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <Hotel className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Hotels</p>
              <p className="font-semibold">${destination.accommodationCost.toLocaleString()}</p>
            </div>
          </div>
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
