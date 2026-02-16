import { motion, AnimatePresence } from 'framer-motion';
import { Hotel, Check, Star, Wifi, Car, Coffee, Dumbbell, Sparkles, TrendingDown, ArrowUpRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { HotelTier } from '@/types/budgetConstraints';

interface HotelTierSelectorProps {
  tiers: HotelTier[];
  selectedPrice: number;
  onSelect: (price: number) => void;
  totalBudget: number;
  nights: number;
}

const tierConfig: Record<string, { label: string; badge: string; color: string }> = {
  '3★': {
    label: 'Budget',
    badge: 'Best Value',
    color: 'bg-success/10 text-success border-success/20',
  },
  '4★': {
    label: 'Comfort',
    badge: 'Popular Choice',
    color: 'bg-primary/10 text-primary border-primary/20',
  },
  '5★': {
    label: 'Luxury',
    badge: 'Premium',
    color: 'bg-warning/10 text-warning border-warning/20',
  },
};

const amenityIcons: Record<string, React.ReactNode> = {
  'WiFi': <Wifi className="h-3 w-3" />,
  'Free WiFi': <Wifi className="h-3 w-3" />,
  'Parking': <Car className="h-3 w-3" />,
  'Free Parking': <Car className="h-3 w-3" />,
  'Breakfast': <Coffee className="h-3 w-3" />,
  'Free Breakfast': <Coffee className="h-3 w-3" />,
  'Gym': <Dumbbell className="h-3 w-3" />,
  'Fitness Center': <Dumbbell className="h-3 w-3" />,
  'Spa': <Sparkles className="h-3 w-3" />,
};

export function HotelTierSelector({
  tiers,
  selectedPrice,
  onSelect,
  totalBudget,
  nights,
}: HotelTierSelectorProps) {
  if (tiers.length === 0) {
    return (
      <div className="rounded-xl bg-muted/50 border border-border p-6 text-center">
        <Hotel className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">No hotel options available</p>
      </div>
    );
  }

  const sortedTiers = [...tiers].sort((a, b) => a.totalPrice - b.totalPrice);
  const budgetTier = sortedTiers[0];

  const calculateSavings = (price: number): number | null => {
    if (!budgetTier) return null;
    const diff = price - budgetTier.totalPrice;
    return diff > 0 ? diff : null;
  };

  const calculateBudgetImpact = (price: number): string => {
    const percentage = ((price / totalBudget) * 100).toFixed(0);
    return `${percentage}% of budget`;
  };

  const renderStars = (tier: string) => {
    const count = parseInt(tier) || 3;
    return (
      <div className="flex items-center gap-0.5">
        {Array.from({ length: count }).map((_, i) => (
          <Star key={i} className="h-3.5 w-3.5 fill-warning text-warning" />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Hotel className="h-5 w-5 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Choose Your Hotel</h3>
        </div>
        <Badge variant="outline" className="text-xs">
          {nights} nights
        </Badge>
      </div>

      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {sortedTiers.map((hotel, index) => {
            const isSelected = hotel.totalPrice === selectedPrice;
            const config = tierConfig[hotel.tier] || tierConfig['3★'];
            const savings = calculateSavings(hotel.totalPrice);
            const budgetImpact = calculateBudgetImpact(hotel.totalPrice);
            const isBudget = index === 0;

            return (
              <motion.div
                key={hotel.tier}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => onSelect(hotel.totalPrice)}
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
                  {renderStars(hotel.tier)}
                  <Badge variant="outline" className={cn('text-xs font-medium', config.color)}>
                    {config.label}
                  </Badge>
                  {isBudget && (
                    <Badge className="bg-success text-success-foreground text-xs">
                      <TrendingDown className="h-3 w-3 mr-1" />
                      Best Price
                    </Badge>
                  )}
                  {hotel.tier === '5★' && (
                    <Badge className="bg-warning/10 text-warning text-xs border border-warning/20">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Premium
                    </Badge>
                  )}
                </div>

                {/* Hotel image + details */}
                <div className="flex gap-3">
                  {hotel.imageUrl && (
                    <div className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-muted">
                      <img
                        src={hotel.imageUrl}
                        alt={hotel.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    </div>
                  )}

                  {/* Hotel details */}
                  <div className="flex items-start justify-between gap-4 flex-1">
                    <div className="space-y-1.5 flex-1">
                      <p className="font-semibold text-foreground">{hotel.name}</p>
                      <p className="text-sm text-muted-foreground">{hotel.description}</p>
                    
                    {/* Amenities */}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {hotel.amenities.slice(0, 4).map((amenity) => (
                        <span
                          key={amenity}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted/50 text-xs text-muted-foreground"
                        >
                          {amenityIcons[amenity] || null}
                          {amenity}
                        </span>
                      ))}
                      {hotel.amenities.length > 4 && (
                        <span className="px-2 py-0.5 rounded-full bg-muted/50 text-xs text-muted-foreground">
                          +{hotel.amenities.length - 4} more
                        </span>
                      )}
                    </div>
                    
                    <p className="text-xs text-muted-foreground mt-1">{budgetImpact}</p>
                  </div>

                  {/* Price */}
                  <div className="text-right">
                    <p className="text-xl font-bold text-foreground">
                      ${hotel.totalPrice.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      ${hotel.pricePerNight}/night
                    </p>
                    {savings && (
                      <p className="text-xs text-muted-foreground mt-1">
                        +${savings} vs budget
                      </p>
                    )}
                  </div>
                </div>
                </div>

                {/* Booking link */}
                {hotel.bookingUrl && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <a
                      href={hotel.bookingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                    >
                      <ArrowUpRight className="h-3.5 w-3.5" />
                      Book this hotel
                    </a>
                  </div>
                )}

                {/* Trade-off hint for selected */}
                {isSelected && savings && !isBudget && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-2 pt-2 border-t border-border"
                  >
                    <p className="text-xs text-muted-foreground">
                      💡 Choosing budget hotel saves ${savings} → could add {Math.floor(savings / 50)} more activities
                    </p>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default HotelTierSelector;
