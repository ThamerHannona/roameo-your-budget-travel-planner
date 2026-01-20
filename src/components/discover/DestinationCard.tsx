import { motion } from 'framer-motion';
import { 
  MapPin, Sun, Cloud, CloudRain, Snowflake, Thermometer, 
  Users, DollarSign, Plus, Check, Star, Plane, Hotel, 
  Utensils, Sparkles, ChevronRight
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { DestinationMatch } from '@/types/destination';
import { cn } from '@/lib/utils';

interface DestinationCardProps {
  destination: DestinationMatch;
  isSelected?: boolean;
  onSelect?: () => void;
  onCompare?: () => void;
  onViewDetails?: () => void;
  compareCount?: number;
}

const WeatherIcon = ({ condition }: { condition: string }) => {
  switch (condition) {
    case 'sunny':
      return <Sun className="h-4 w-4 text-warning" />;
    case 'partly-cloudy':
      return <Cloud className="h-4 w-4 text-muted-foreground" />;
    case 'rainy':
      return <CloudRain className="h-4 w-4 text-primary" />;
    case 'cold':
      return <Snowflake className="h-4 w-4 text-primary" />;
    case 'hot':
      return <Thermometer className="h-4 w-4 text-destructive" />;
    default:
      return <Sun className="h-4 w-4" />;
  }
};

const ConfidenceStars = ({ score }: { score: number }) => {
  // Convert 0-100 score to 1-5 stars
  const stars = Math.round((score / 100) * 5);
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star 
          key={i} 
          className={cn(
            'h-3 w-3',
            i < stars ? 'fill-warning text-warning' : 'text-muted-foreground/30'
          )} 
        />
      ))}
    </div>
  );
};

const AffordabilityBadge = ({ 
  affordability, 
  budgetDelta 
}: { 
  affordability: DestinationMatch['affordability']; 
  budgetDelta: number;
}) => {
  const variants = {
    'budget-friendly': 'bg-success/10 text-success border-success/20',
    'good-value': 'bg-primary/10 text-primary border-primary/20',
    'splurge': 'bg-warning/10 text-warning border-warning/20',
    'over-budget': 'bg-destructive/10 text-destructive border-destructive/20',
  };
  
  const getLabel = () => {
    if (budgetDelta > 0) {
      return `$${Math.abs(budgetDelta).toLocaleString()} under budget`;
    } else if (budgetDelta < 0) {
      return `$${Math.abs(budgetDelta).toLocaleString()} over budget`;
    }
    return 'At budget';
  };
  
  return (
    <Badge 
      variant="outline" 
      className={cn('text-xs font-medium', variants[affordability])}
    >
      {getLabel()}
    </Badge>
  );
};

export function DestinationCard({ 
  destination, 
  isSelected = false,
  onSelect,
  onCompare,
  onViewDetails,
  compareCount = 0,
}: DestinationCardProps) {
  const currentMonth = new Date().getMonth() + 1;
  const weather = destination.weather[currentMonth];
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Card className={cn(
        'overflow-hidden cursor-pointer transition-all duration-300 h-full',
        isSelected && 'ring-2 ring-primary shadow-lg'
      )}>
        {/* Image */}
        <div className="relative h-40 overflow-hidden">
          <img
            src={destination.imageUrl}
            alt={destination.name}
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
          />
          
          {/* Confidence Score Badge */}
          <div className="absolute top-3 left-3">
            <div className="bg-background/90 backdrop-blur-sm rounded-lg px-2.5 py-1.5 flex flex-col gap-0.5">
              <div className="flex items-center gap-1.5">
                <span className={cn(
                  'text-sm font-bold',
                  destination.confidenceScore >= 90 ? 'text-success' : 
                  destination.confidenceScore >= 80 ? 'text-warning' : 'text-muted-foreground'
                )}>
                  {destination.confidenceScore}%
                </span>
                <span className="text-[10px] text-muted-foreground">confidence</span>
              </div>
              <ConfidenceStars score={destination.confidenceScore} />
            </div>
          </div>
          
          {/* Compare Button */}
          {onCompare && (
            <Button
              size="sm"
              variant={isSelected ? 'default' : 'secondary'}
              className="absolute top-3 right-3 h-7 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                onCompare();
              }}
              disabled={!isSelected && compareCount >= 3}
            >
              {isSelected ? (
                <>
                  <Check className="h-3 w-3 mr-1" />
                  Added
                </>
              ) : (
                <>
                  <Plus className="h-3 w-3 mr-1" />
                  Compare
                </>
              )}
            </Button>
          )}
          
          {/* Budget Badge */}
          <div className="absolute bottom-3 left-3">
            <AffordabilityBadge 
              affordability={destination.affordability} 
              budgetDelta={destination.budgetDelta}
            />
          </div>
        </div>
        
        <CardContent className="p-4 space-y-3" onClick={onSelect}>
          {/* Location with Flag */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{destination.flagEmoji}</span>
              <div>
                <h3 className="font-display font-bold text-lg text-foreground leading-tight">
                  {destination.name}
                </h3>
                <div className="flex items-center gap-1 text-muted-foreground text-sm">
                  <MapPin className="h-3 w-3" />
                  {destination.country}
                </div>
              </div>
            </div>
            
            {/* Total Cost */}
            <div className="text-right">
              <div className="text-xl font-bold text-foreground">
                ${destination.estimatedTotalCost.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">total</div>
            </div>
          </div>
          
          {/* Quick Stats */}
          <div className="flex items-center gap-4 text-sm">
            {weather && (
              <div className="flex items-center gap-1">
                <WeatherIcon condition={weather.condition} />
                <span className="font-medium">{Math.round(weather.temp)}°F</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Users className={cn(
                'h-4 w-4',
                destination.crowdScore >= 70 ? 'text-success' :
                destination.crowdScore >= 50 ? 'text-warning' : 'text-destructive'
              )} />
              <span className="text-muted-foreground">
                {destination.crowdScore >= 70 ? 'Low' : 
                 destination.crowdScore >= 50 ? 'Moderate' : 'Busy'}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-muted-foreground">Value: {destination.valueScore}</span>
            </div>
          </div>
          
          {/* Mini Budget Breakdown */}
          <div className="bg-muted/50 rounded-lg p-3 space-y-2">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1.5">
                <Plane className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">Flight:</span>
                <span className="font-medium">${destination.flightCost}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Hotel className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">Hotel:</span>
                <span className="font-medium">${destination.accommodationCost}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">Activities:</span>
                <span className="font-medium">${destination.activitiesCost}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Utensils className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">Food:</span>
                <span className="font-medium">${destination.foodCost}</span>
              </div>
            </div>
          </div>
          
          {/* Why This Works */}
          <div className="flex items-start gap-2 text-sm">
            <div className="p-1 bg-success/10 rounded">
              <Check className="h-3 w-3 text-success" />
            </div>
            <p className="text-muted-foreground italic leading-snug">
              "{destination.whyThisWorks}"
            </p>
          </div>
          
          {/* View Details Button */}
          {onViewDetails && (
            <Button 
              variant="outline" 
              className="w-full mt-2 gap-2" 
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails();
              }}
            >
              View Details
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
