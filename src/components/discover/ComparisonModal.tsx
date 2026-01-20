import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Minus, MapPin, Sun, CloudRain, Users, DollarSign, Plane, ArrowRight } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DestinationMatch } from '@/types/destination';
import { cn } from '@/lib/utils';

interface ComparisonModalProps {
  open: boolean;
  onClose: () => void;
  destinations: DestinationMatch[];
  onSelect: (destination: DestinationMatch) => void;
}

interface ComparisonRowProps {
  label: string;
  values: (string | number | React.ReactNode)[];
  highlight?: 'highest' | 'lowest' | 'none';
  highlightIndex?: number;
}

const ComparisonRow = ({ label, values, highlight = 'none', highlightIndex }: ComparisonRowProps) => (
  <div className="grid gap-4" style={{ gridTemplateColumns: `140px repeat(${values.length}, 1fr)` }}>
    <div className="text-sm font-medium text-muted-foreground py-3">{label}</div>
    {values.map((value, i) => (
      <div
        key={i}
        className={cn(
          'py-3 text-sm font-medium text-center border-l border-border',
          highlight !== 'none' && highlightIndex === i && 'text-success font-bold'
        )}
      >
        {value}
      </div>
    ))}
  </div>
);

const ScoreBar = ({ score, color }: { score: number; color: string }) => (
  <div className="flex items-center gap-2 justify-center">
    <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${score}%` }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className={cn('h-full rounded-full', color)}
      />
    </div>
    <span className="text-xs font-medium">{score}</span>
  </div>
);

export function ComparisonModal({ open, onClose, destinations, onSelect }: ComparisonModalProps) {
  if (destinations.length === 0) return null;
  
  // Find best values
  const lowestCostIndex = destinations.indexOf(
    destinations.reduce((a, b) => a.estimatedTotalCost < b.estimatedTotalCost ? a : b)
  );
  const highestValueIndex = destinations.indexOf(
    destinations.reduce((a, b) => a.valueScore > b.valueScore ? a : b)
  );
  const bestWeatherIndex = destinations.indexOf(
    destinations.reduce((a, b) => a.weatherScore > b.weatherScore ? a : b)
  );
  const leastCrowdedIndex = destinations.indexOf(
    destinations.reduce((a, b) => a.crowdScore > b.crowdScore ? a : b)
  );
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            Compare Destinations
          </DialogTitle>
        </DialogHeader>
        
        <div className="mt-4">
          {/* Destination Headers */}
          <div 
            className="grid gap-4 mb-6" 
            style={{ gridTemplateColumns: `140px repeat(${destinations.length}, 1fr)` }}
          >
            <div />
            {destinations.map((dest, i) => (
              <motion.div
                key={dest.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div className="relative mb-3">
                  <img
                    src={dest.imageUrl}
                    alt={dest.name}
                    className="w-full h-24 object-cover rounded-lg"
                  />
                  {highestValueIndex === i && (
                    <Badge className="absolute -top-2 -right-2 bg-success text-success-foreground">
                      Best Value
                    </Badge>
                  )}
                </div>
                <h3 className="font-display font-bold text-foreground">{dest.name}</h3>
                <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {dest.country}
                </p>
              </motion.div>
            ))}
          </div>
          
          {/* Comparison Table */}
          <div className="space-y-0 divide-y divide-border border-t border-border">
            <ComparisonRow
              label="Total Cost"
              values={destinations.map(d => (
                <span className={cn(
                  'flex items-center justify-center gap-1',
                  lowestCostIndex === destinations.indexOf(d) && 'text-success'
                )}>
                  <DollarSign className="h-4 w-4" />
                  {d.estimatedTotalCost.toLocaleString()}
                </span>
              ))}
              highlight="lowest"
              highlightIndex={lowestCostIndex}
            />
            
            <ComparisonRow
              label="Daily Cost"
              values={destinations.map(d => `$${d.dailyCost}/day`)}
            />
            
            <ComparisonRow
              label="Flight Cost"
              values={destinations.map(d => (
                <span className="flex items-center justify-center gap-1">
                  <Plane className="h-3 w-3" />
                  ${d.flightCost}
                </span>
              ))}
            />
            
            <ComparisonRow
              label="Value Score"
              values={destinations.map(d => (
                <ScoreBar 
                  score={d.valueScore} 
                  color={d.valueScore >= 70 ? 'bg-success' : d.valueScore >= 50 ? 'bg-warning' : 'bg-muted'}
                />
              ))}
            />
            
            <ComparisonRow
              label="Weather Score"
              values={destinations.map(d => (
                <ScoreBar 
                  score={d.weatherScore} 
                  color={d.weatherScore >= 70 ? 'bg-success' : d.weatherScore >= 50 ? 'bg-warning' : 'bg-muted'}
                />
              ))}
            />
            
            <ComparisonRow
              label="Crowd Level"
              values={destinations.map(d => (
                <div className="flex items-center justify-center gap-1">
                  <Users className="h-3 w-3 text-muted-foreground" />
                  <span>{d.crowdScore >= 70 ? 'Low' : d.crowdScore >= 50 ? 'Moderate' : 'High'}</span>
                </div>
              ))}
            />
            
            <ComparisonRow
              label="Best For"
              values={destinations.map(d => (
                <div className="flex flex-wrap gap-1 justify-center">
                  {d.bestFor.slice(0, 2).map((item, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {item}
                    </Badge>
                  ))}
                </div>
              ))}
            />
            
            <ComparisonRow
              label="Highlights"
              values={destinations.map(d => (
                <ul className="text-xs text-left space-y-1">
                  {d.highlights.slice(0, 3).map((h, i) => (
                    <li key={i} className="flex items-start gap-1">
                      <Check className="h-3 w-3 text-success mt-0.5 flex-shrink-0" />
                      {h}
                    </li>
                  ))}
                </ul>
              ))}
            />
          </div>
          
          {/* Action Buttons */}
          <div 
            className="grid gap-4 mt-6 pt-4 border-t border-border"
            style={{ gridTemplateColumns: `140px repeat(${destinations.length}, 1fr)` }}
          >
            <div />
            {destinations.map((dest) => (
              <Button
                key={dest.id}
                onClick={() => onSelect(dest)}
                className="w-full"
              >
                Choose {dest.name}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
