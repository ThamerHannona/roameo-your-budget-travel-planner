import { motion } from 'framer-motion';
import { MapPin, Sun, Cloud, CloudRain, Snowflake, Thermometer, Users, DollarSign, Plus, Check } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DestinationMatch } from '@/types/destination';
import { cn } from '@/lib/utils';

interface DestinationCardProps {
  destination: DestinationMatch;
  isSelected?: boolean;
  onSelect?: () => void;
  onCompare?: () => void;
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

const AffordabilityBadge = ({ affordability }: { affordability: DestinationMatch['affordability'] }) => {
  const variants = {
    'budget-friendly': 'bg-success/10 text-success border-success/20',
    'good-value': 'bg-primary/10 text-primary border-primary/20',
    'splurge': 'bg-warning/10 text-warning border-warning/20',
    'over-budget': 'bg-destructive/10 text-destructive border-destructive/20',
  };
  
  const labels = {
    'budget-friendly': 'Great Value',
    'good-value': 'Good Value',
    'splurge': 'Worth the Splurge',
    'over-budget': 'Over Budget',
  };
  
  return (
    <Badge 
      variant="outline" 
      className={cn('text-xs font-medium', variants[affordability])}
    >
      {labels[affordability]}
    </Badge>
  );
};

export function DestinationCard({ 
  destination, 
  isSelected = false,
  onSelect,
  onCompare,
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
        'overflow-hidden cursor-pointer transition-all duration-300',
        isSelected && 'ring-2 ring-primary shadow-lg'
      )}>
        {/* Image */}
        <div className="relative h-48 overflow-hidden">
          <img
            src={destination.imageUrl}
            alt={destination.name}
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
          />
          
          {/* Value Score Badge */}
          <div className="absolute top-3 left-3">
            <div className="bg-background/90 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">Value</span>
              <span className={cn(
                'text-sm font-bold',
                destination.valueScore >= 70 ? 'text-success' : 
                destination.valueScore >= 50 ? 'text-warning' : 'text-muted-foreground'
              )}>
                {destination.valueScore}
              </span>
            </div>
          </div>
          
          {/* Compare Button */}
          {onCompare && (
            <Button
              size="sm"
              variant={isSelected ? 'default' : 'secondary'}
              className="absolute top-3 right-3"
              onClick={(e) => {
                e.stopPropagation();
                onCompare();
              }}
              disabled={!isSelected && compareCount >= 3}
            >
              {isSelected ? (
                <>
                  <Check className="h-3 w-3 mr-1" />
                  Selected
                </>
              ) : (
                <>
                  <Plus className="h-3 w-3 mr-1" />
                  Compare
                </>
              )}
            </Button>
          )}
          
          {/* Affordability Badge */}
          <div className="absolute bottom-3 left-3">
            <AffordabilityBadge affordability={destination.affordability} />
          </div>
        </div>
        
        <CardContent className="p-4 space-y-3" onClick={onSelect}>
          {/* Location */}
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-display font-bold text-lg text-foreground">
                {destination.name}
              </h3>
              <div className="flex items-center gap-1 text-muted-foreground text-sm">
                <MapPin className="h-3 w-3" />
                {destination.country}
              </div>
            </div>
            
            {/* Weather */}
            {weather && (
              <div className="flex items-center gap-1 text-sm">
                <WeatherIcon condition={weather.condition} />
                <span className="font-medium">{Math.round(weather.temp)}°F</span>
              </div>
            )}
          </div>
          
          {/* Cost Breakdown */}
          <div className="bg-muted/50 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Estimated total</span>
              <span className="font-bold text-foreground">
                ${destination.estimatedTotalCost.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                ${destination.dailyCost}/day
              </span>
              <span>+ ${destination.flightCost} flights</span>
            </div>
          </div>
          
          {/* Scores */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2 text-xs">
              <div className={cn(
                'w-2 h-2 rounded-full',
                destination.weatherScore >= 70 ? 'bg-success' :
                destination.weatherScore >= 50 ? 'bg-warning' : 'bg-muted'
              )} />
              <span className="text-muted-foreground">Weather: {destination.weatherScore}%</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Users className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">
                {destination.crowdScore >= 70 ? 'Uncrowded' : 
                 destination.crowdScore >= 50 ? 'Moderate' : 'Busy'}
              </span>
            </div>
          </div>
          
          {/* Highlights */}
          <div className="flex flex-wrap gap-1">
            {destination.highlights.slice(0, 3).map((highlight, i) => (
              <Badge key={i} variant="outline" className="text-xs bg-background">
                {highlight}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
