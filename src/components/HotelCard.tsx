import { motion } from 'framer-motion';
import { Star, MapPin, Wifi, Car, Waves, Check, Plus, X } from 'lucide-react';
import { Hotel } from '@/types/travel';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface HotelCardProps {
  hotel: Hotel;
  isAdded: boolean;
  onAdd: (hotel: Hotel) => void;
  budgetExceeded: boolean;
  nights: number;
}

const amenityIcons: Record<string, React.ReactNode> = {
  wifi: <Wifi className="h-3 w-3" aria-hidden="true" />,
  parking: <Car className="h-3 w-3" aria-hidden="true" />,
  pool: <Waves className="h-3 w-3" aria-hidden="true" />,
};

export function HotelCard({ hotel, isAdded, onAdd, budgetExceeded, nights }: HotelCardProps) {
  const { toast } = useToast();
  const isDisabled = budgetExceeded && !isAdded;

  const handleClick = () => {
    onAdd(hotel);
    
    if (isAdded) {
      toast({
        title: "Hotel removed",
        description: `${hotel.name} removed from your trip.`,
      });
    } else {
      toast({
        title: "Hotel added", 
        description: `${hotel.name} added to your trip for ${nights} nights.`,
      });
    }
  };
  
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, boxShadow: '0 10px 30px -10px hsl(var(--primary) / 0.2)' }}
      className={`relative bg-card rounded-xl overflow-hidden shadow-md border-2 transition-colors ${
        isAdded ? 'border-primary shadow-glow' : 'border-transparent hover:border-primary/30'
      } ${isDisabled ? 'opacity-60' : ''}`}
      role="listitem"
      aria-label={`${hotel.name} in ${hotel.location}, ${hotel.rating} stars, $${hotel.totalPrice} for ${nights} nights`}
    >
      {isAdded && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-2 right-2 z-10 bg-primary text-primary-foreground rounded-full p-1"
          aria-hidden="true"
        >
          <Check className="h-4 w-4" />
        </motion.div>
      )}

      <div className="relative h-40 overflow-hidden">
        <img
          src={hotel.image || 'https://placehold.co/400x300'}
          alt={`${hotel.name} exterior view`}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent" aria-hidden="true" />
        <div className="absolute bottom-2 left-3 flex items-center gap-1 text-accent" aria-label={`${hotel.rating} out of 5 stars`}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`h-4 w-4 ${i < hotel.rating ? 'fill-current' : 'opacity-30'}`}
              aria-hidden="true"
            />
          ))}
          <span className="text-xs text-card-foreground ml-1">({hotel.reviewCount} reviews)</span>
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-display font-bold text-lg text-foreground mb-1">{hotel.name}</h3>
        
        <div className="flex items-center gap-1 text-muted-foreground text-sm mb-3">
          <MapPin className="h-3 w-3" aria-hidden="true" />
          <span>{hotel.location}</span>
        </div>

        <div className="flex gap-2 mb-4 flex-wrap" role="list" aria-label="Hotel amenities">
          {hotel.amenities.slice(0, 3).map((amenity) => (
            <div
              key={amenity}
              className="flex items-center gap-1 bg-muted px-2 py-1 rounded-full text-xs text-muted-foreground"
              role="listitem"
            >
              {amenityIcons[amenity.toLowerCase()] || null}
              <span className="capitalize">{amenity}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-display font-bold text-primary">${hotel.totalPrice}</p>
            <p className="text-xs text-muted-foreground">
              ${hotel.pricePerNight}/night × {nights} nights
            </p>
          </div>
          <Button
            variant={isAdded ? "destructive" : "default"}
            onClick={handleClick}
            disabled={isDisabled}
            className={`gap-2 transition-transform focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${isDisabled ? 'cursor-not-allowed' : ''}`}
            aria-label={isAdded ? `Remove ${hotel.name}` : `Add ${hotel.name} to trip`}
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
      </div>
    </motion.article>
  );
}
