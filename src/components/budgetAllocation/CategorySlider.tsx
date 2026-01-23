import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Info, ChevronDown, ChevronUp, Plane, Hotel, MapPin, Utensils, Car } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { CategoryKey, BudgetConstraints, FlightOption, HotelTier } from '@/types/budgetConstraints';
import { CATEGORY_LABELS, CATEGORY_COLORS } from '@/types/budgetConstraints';

interface CategorySliderProps {
  category: CategoryKey;
  constraints: BudgetConstraints[CategoryKey];
  totalBudget: number;
  onChange: (value: number) => void;
  selectedFlight?: FlightOption | null;
  selectedHotel?: HotelTier | null;
}

const categoryIcons = {
  flights: Plane,
  hotels: Hotel,
  activities: MapPin,
  food: Utensils,
  transport: Car,
};

export function CategorySlider({
  category,
  constraints,
  totalBudget,
  onChange,
  selectedFlight,
  selectedHotel,
}: CategorySliderProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const Icon = categoryIcons[category];
  const percentage = Math.round((constraints.current / totalBudget) * 100);
  const isAtMin = constraints.current <= constraints.min;
  const isAtMax = constraints.current >= constraints.max;

  // Get current selection details
  const getCurrentDetails = useMemo(() => {
    if (category === 'flights' && selectedFlight) {
      return {
        title: selectedFlight.airline,
        subtitle: `${selectedFlight.stops === 0 ? 'Direct' : `${selectedFlight.stops} stop`} • ${selectedFlight.duration}`,
        badge: selectedFlight.direct ? 'Direct' : `${selectedFlight.stops} stop`,
      };
    }
    if (category === 'hotels' && selectedHotel) {
      return {
        title: `${selectedHotel.tier} ${selectedHotel.name}`,
        subtitle: selectedHotel.description,
        badge: selectedHotel.tier,
      };
    }
    if (category === 'activities') {
      const activityConstraint = constraints as BudgetConstraints['activities'];
      const tier = constraints.current <= activityConstraint.tiers.essentials.cost
        ? 'essentials'
        : constraints.current <= activityConstraint.tiers.balanced.cost
        ? 'balanced'
        : 'premium';
      const tierData = activityConstraint.tiers[tier];
      return {
        title: `${tierData.count} activities`,
        subtitle: tierData.examples.join(', '),
        badge: tier.charAt(0).toUpperCase() + tier.slice(1),
      };
    }
    if (category === 'food') {
      const foodConstraint = constraints as BudgetConstraints['food'];
      const perDay = Math.round(constraints.current / 7);
      const tier = perDay <= foodConstraint.perDay.budget
        ? 'Budget'
        : perDay <= foodConstraint.perDay.mid
        ? 'Mid-range'
        : 'Premium';
      return {
        title: `$${perDay}/day per person`,
        subtitle: tier === 'Budget' ? 'Street food & casual' : tier === 'Mid-range' ? 'Mix of casual & nice' : 'Fine dining included',
        badge: tier,
      };
    }
    if (category === 'transport') {
      const transportConstraint = constraints as BudgetConstraints['transport'];
      const tier = constraints.current <= transportConstraint.options.budget
        ? 'Public'
        : constraints.current <= transportConstraint.options.mid
        ? 'Mixed'
        : 'Private';
      return {
        title: tier === 'Public' ? 'Public transport & taxis' : tier === 'Mixed' ? 'Mix of private & public' : 'All private transfers',
        subtitle: `$${Math.round(constraints.current / 7)}/day`,
        badge: tier,
      };
    }
    return { title: '', subtitle: '', badge: '' };
  }, [category, constraints, selectedFlight, selectedHotel]);

  const handleSliderChange = useCallback(
    (values: number[]) => {
      onChange(values[0]);
    },
    [onChange]
  );

  // Get available options for flights/hotels
  const getOptionsInfo = () => {
    if (category === 'flights') {
      const flightConstraint = constraints as BudgetConstraints['flights'];
      return {
        count: flightConstraint.options.length,
        range: `$${constraints.min.toLocaleString()}-$${constraints.max.toLocaleString()}`,
      };
    }
    if (category === 'hotels') {
      const hotelConstraint = constraints as BudgetConstraints['hotels'];
      return {
        count: hotelConstraint.tiers.length,
        range: `$${constraints.min.toLocaleString()}-$${constraints.max.toLocaleString()}`,
      };
    }
    return null;
  };

  const optionsInfo = getOptionsInfo();

  return (
    <motion.div
      layout
      className={cn(
        'rounded-xl border bg-card p-4 transition-all',
        isDragging && 'ring-2 ring-primary/50 shadow-lg',
        isExpanded && 'bg-card/80'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${CATEGORY_COLORS[category]}20` }}
          >
            <Icon className="h-5 w-5" style={{ color: CATEGORY_COLORS[category] }} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground">
                {CATEGORY_LABELS[category]}
              </span>
              {optionsInfo && (
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3.5 w-3.5 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{optionsInfo.count} options available</p>
                    <p className="text-xs text-muted-foreground">{optionsInfo.range}</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {getCurrentDetails.subtitle}
            </p>
          </div>
        </div>

        <div className="text-right">
          <motion.div
            key={constraints.current}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="font-display text-xl font-bold text-foreground"
          >
            ${constraints.current.toLocaleString()}
          </motion.div>
          <span className="text-sm text-muted-foreground">({percentage}%)</span>
        </div>
      </div>

      {/* Current Selection Badge */}
      <div className="flex items-center gap-2 mb-3">
        <Badge
          variant="secondary"
          className="text-xs"
          style={{ 
            backgroundColor: `${CATEGORY_COLORS[category]}15`,
            color: CATEGORY_COLORS[category],
          }}
        >
          {getCurrentDetails.badge}
        </Badge>
        <span className="text-sm text-foreground">{getCurrentDetails.title}</span>
      </div>

      {/* Slider with boundaries */}
      <div className="relative pt-2 pb-6">
        {/* Boundary indicators */}
        <div className="absolute -top-1 left-0 right-0 flex justify-between text-[10px] text-muted-foreground">
          <span className="flex items-center gap-0.5">
            {isAtMin && <Lock className="h-2.5 w-2.5" />}
            ${constraints.min.toLocaleString()}
          </span>
          <span className="flex items-center gap-0.5">
            ${constraints.max.toLocaleString()}
            {isAtMax && <Lock className="h-2.5 w-2.5" />}
          </span>
        </div>

        <Slider
          value={[constraints.current]}
          onValueChange={handleSliderChange}
          onPointerDown={() => setIsDragging(true)}
          onPointerUp={() => setIsDragging(false)}
          min={constraints.min}
          max={constraints.max}
          step={constraints.flexible ? 25 : 1}
          className="w-full"
        />

        {/* Position labels */}
        <div className="absolute -bottom-1 left-0 right-0 flex justify-between text-[10px]">
          <span className="text-muted-foreground">
            {category === 'flights' ? 'Budget' : category === 'hotels' ? '3★' : 'Essential'}
          </span>
          <span className="text-muted-foreground">
            {category === 'flights' ? 'Premium' : category === 'hotels' ? '5★' : 'Premium'}
          </span>
        </div>
      </div>

      {/* Expandable options */}
      {(category === 'flights' || category === 'hotels') && (
        <>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center justify-center gap-1 w-full py-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {isExpanded ? 'Hide options' : 'Show all options'}
            {isExpanded ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </button>

          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="pt-3 space-y-2 border-t mt-2">
                  {category === 'flights' &&
                    (constraints as BudgetConstraints['flights']).options.map((flight) => (
                      <button
                        key={flight.flightNumber}
                        onClick={() => onChange(flight.price)}
                        className={cn(
                          'w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors',
                          constraints.current === flight.price
                            ? 'bg-primary/10 border border-primary/30'
                            : 'hover:bg-muted'
                        )}
                      >
                        <div>
                          <div className="font-medium text-sm">{flight.airline}</div>
                          <div className="text-xs text-muted-foreground">
                            {flight.direct ? 'Direct' : `${flight.stops} stop${flight.stops > 1 ? 's' : ''}`} • {flight.duration}
                            {flight.layover && ` • ${flight.layover}`}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">${flight.price.toLocaleString()}</div>
                          {constraints.current === flight.price && (
                            <Badge variant="secondary" className="text-[10px]">Selected</Badge>
                          )}
                        </div>
                      </button>
                    ))}

                  {category === 'hotels' &&
                    (constraints as BudgetConstraints['hotels']).tiers.map((hotel) => (
                      <button
                        key={hotel.tier}
                        onClick={() => onChange(hotel.totalPrice)}
                        className={cn(
                          'w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors',
                          constraints.current === hotel.totalPrice
                            ? 'bg-primary/10 border border-primary/30'
                            : 'hover:bg-muted'
                        )}
                      >
                        <div>
                          <div className="font-medium text-sm">{hotel.tier} {hotel.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {hotel.description}
                          </div>
                          <div className="flex gap-1 mt-1 flex-wrap">
                            {hotel.amenities.slice(0, 3).map((amenity) => (
                              <Badge key={amenity} variant="outline" className="text-[10px] px-1.5 py-0">
                                {amenity}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">${hotel.totalPrice.toLocaleString()}</div>
                          <div className="text-xs text-muted-foreground">${hotel.pricePerNight}/night</div>
                          {constraints.current === hotel.totalPrice && (
                            <Badge variant="secondary" className="text-[10px]">Selected</Badge>
                          )}
                        </div>
                      </button>
                    ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </motion.div>
  );
}
