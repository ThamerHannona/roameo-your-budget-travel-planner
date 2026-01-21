import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Lock, MapPin, Sparkles, ChevronDown, ChevronUp, 
  Calendar, Plane, Clock, Bell, Check, TrendingDown
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { GhostTrip, UnlockStrategy } from '@/types/ghostTrip';
import { cn } from '@/lib/utils';

interface GhostTripCardProps {
  trip: GhostTrip;
  onUnlockCalculator: () => void;
  onTrackPrice: () => void;
  onCompareVsAffordable?: () => void;
  isTracking?: boolean;
}

const StrategyIcon = ({ type }: { type: UnlockStrategy['type'] }) => {
  switch (type) {
    case 'book-earlier':
      return <Calendar className="h-4 w-4" />;
    case 'increase-budget':
      return <TrendingDown className="h-4 w-4" />;
    case 'reduce-days':
      return <Clock className="h-4 w-4" />;
    case 'off-season':
      return <Sparkles className="h-4 w-4" />;
    case 'longer-flights':
      return <Plane className="h-4 w-4" />;
    default:
      return <Sparkles className="h-4 w-4" />;
  }
};

export function GhostTripCard({
  trip,
  onUnlockCalculator,
  onTrackPrice,
  onCompareVsAffordable,
  isTracking = false,
}: GhostTripCardProps) {
  const [showStrategies, setShowStrategies] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ 
        y: -4,
        boxShadow: '0 0 30px rgba(251, 146, 60, 0.15)',
      }}
      transition={{ duration: 0.2 }}
    >
      <Card className={cn(
        'overflow-hidden transition-all duration-300 h-full',
        'border-dashed border-2 border-warning/40',
        'opacity-90 hover:opacity-100',
        'bg-gradient-to-br from-background to-warning/5'
      )}>
        {/* Image with Lock Overlay */}
        <div className="relative h-36 overflow-hidden">
          <img
            src={trip.imageUrl}
            alt={trip.name}
            className="w-full h-full object-cover grayscale-[30%]"
          />
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/30 to-transparent" />
          
          {/* Lock Icon */}
          <div className="absolute top-3 right-3">
            <div className="bg-warning/20 backdrop-blur-sm rounded-full p-2">
              <Lock className="h-4 w-4 text-warning" />
            </div>
          </div>
          
          {/* Over Budget Badge */}
          <div className="absolute bottom-3 left-3">
            <Badge 
              variant="outline" 
              className="bg-warning/10 text-warning border-warning/30 font-semibold"
            >
              +${trip.amountOver.toLocaleString()} over budget
            </Badge>
          </div>
        </div>
        
        <CardContent className="p-4 space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xl">{trip.flagEmoji}</span>
              <div>
                <h3 className="font-display font-bold text-base text-foreground leading-tight">
                  {trip.name}
                </h3>
                <div className="flex items-center gap-1 text-muted-foreground text-xs">
                  <MapPin className="h-3 w-3" />
                  {trip.country}
                </div>
              </div>
            </div>
            
            {/* Price */}
            <div className="text-right">
              <div className="text-lg font-bold text-foreground">
                ${trip.estimatedTotalCost.toLocaleString()}
              </div>
              <div className="text-xs text-warning font-medium">
                +${trip.amountOver}
              </div>
            </div>
          </div>
          
          {/* Special Features */}
          <div className="space-y-1.5">
            {trip.specialFeatures.slice(0, 2).map((feature, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                <Sparkles className="h-3 w-3 text-warning" />
                {feature}
              </div>
            ))}
          </div>
          
          {/* Unlock Strategies Toggle */}
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-between text-xs h-8 text-muted-foreground hover:text-foreground"
            onClick={() => setShowStrategies(!showStrategies)}
          >
            <span>How to unlock this trip</span>
            {showStrategies ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
          
          {/* Strategies List */}
          <AnimatePresence>
            {showStrategies && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="space-y-2 overflow-hidden"
              >
                {trip.unlockStrategies.map((strategy) => (
                  <div
                    key={strategy.id}
                    className={cn(
                      'flex items-start gap-2 p-2 rounded-md text-xs',
                      strategy.isUnlocked 
                        ? 'bg-success/10 border border-success/20' 
                        : 'bg-muted/50'
                    )}
                  >
                    <div className={cn(
                      'p-1 rounded',
                      strategy.isUnlocked ? 'text-success' : 'text-muted-foreground'
                    )}>
                      <StrategyIcon type={strategy.type} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-foreground">{strategy.title}</div>
                      <div className="text-muted-foreground text-[10px] truncate">
                        {strategy.description}
                      </div>
                    </div>
                    {strategy.isUnlocked && (
                      <Badge variant="outline" className="text-success border-success/30 text-[10px] shrink-0">
                        <Check className="h-2.5 w-2.5 mr-0.5" />
                        Unlocks
                      </Badge>
                    )}
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Action Buttons */}
          <div className="flex gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-1.5 text-xs border-warning/30 text-warning hover:bg-warning/10 hover:text-warning"
              onClick={onUnlockCalculator}
            >
              <Sparkles className="h-3.5 w-3.5" />
              How can I afford this?
            </Button>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'flex-1 gap-1.5 text-xs',
                isTracking && 'bg-primary/10 text-primary'
              )}
              onClick={onTrackPrice}
            >
              <Bell className={cn('h-3.5 w-3.5', isTracking && 'fill-current')} />
              {isTracking ? 'Tracking' : 'Track Price'}
            </Button>
            
            {onCompareVsAffordable && (
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 gap-1.5 text-xs"
                onClick={onCompareVsAffordable}
              >
                Worth the extra?
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
