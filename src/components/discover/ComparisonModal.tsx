import { motion } from 'framer-motion';
import { 
  DollarSign, 
  Plane, 
  Building2, 
  Utensils, 
  MapPin as Activities,
  Bus,
  Sun,
  Users,
  Star,
  ArrowRight,
  TrendingUp
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { DestinationMatch } from '@/types/destination';
import { cn } from '@/lib/utils';
import { 
  ComparisonHeader, 
  ComparisonRow, 
  ScoreBar, 
  SmartInsights,
  ProsConsSection 
} from './comparison';

interface ComparisonModalProps {
  open: boolean;
  onClose: () => void;
  destinations: DestinationMatch[];
  onSelect: (destination: DestinationMatch) => void;
}

export function ComparisonModal({ open, onClose, destinations, onSelect }: ComparisonModalProps) {
  if (destinations.length === 0) return null;
  
  // Find best values for highlighting
  const lowestCostIndex = destinations.indexOf(
    destinations.reduce((a, b) => a.estimatedTotalCost < b.estimatedTotalCost ? a : b)
  );
  const highestValueIndex = destinations.indexOf(
    destinations.reduce((a, b) => a.valueScore > b.valueScore ? a : b)
  );
  const lowestFlightIndex = destinations.indexOf(
    destinations.reduce((a, b) => a.flightCost < b.flightCost ? a : b)
  );
  const lowestHotelIndex = destinations.indexOf(
    destinations.reduce((a, b) => a.accommodationCost < b.accommodationCost ? a : b)
  );
  const bestWeatherIndex = destinations.indexOf(
    destinations.reduce((a, b) => a.weatherScore > b.weatherScore ? a : b)
  );
  const leastCrowdedIndex = destinations.indexOf(
    destinations.reduce((a, b) => a.crowdScore > b.crowdScore ? a : b)
  );
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm p-6 pb-4 border-b">
          <DialogTitle className="font-display text-xl flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Compare Destinations
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Side-by-side comparison to help you choose the perfect trip
          </p>
        </DialogHeader>
        
        <div className="p-6 pt-4">
          {/* Destination Headers */}
          <ComparisonHeader 
            destinations={destinations} 
            bestValueIndex={highestValueIndex} 
          />
          
          {/* Comparison Table */}
          <div className="space-y-0 divide-y divide-border border-t border-b border-border rounded-lg bg-card">
            {/* Cost Section */}
            <div className="bg-muted/30 px-3 py-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Cost Breakdown
              </span>
            </div>
            
            <ComparisonRow
              label="Total Cost"
              icon={<DollarSign className="h-4 w-4 text-primary" />}
              values={destinations.map((d, i) => (
                <div className="flex flex-col items-center">
                  <span className={cn(
                    'text-lg font-bold',
                    i === lowestCostIndex && 'text-success'
                  )}>
                    ${d.estimatedTotalCost.toLocaleString()}
                  </span>
                  <Badge 
                    variant="outline" 
                    className={cn(
                      'text-xs mt-1',
                      d.budgetDelta >= 0 ? 'text-success border-success/30' : 'text-destructive border-destructive/30'
                    )}
                  >
                    {d.budgetDelta >= 0 ? `$${d.budgetDelta} under` : `$${Math.abs(d.budgetDelta)} over`}
                  </Badge>
                </div>
              ))}
              highlightBest="lowest"
              bestIndex={lowestCostIndex}
            />
            
            <ComparisonRow
              label="Flight Cost"
              icon={<Plane className="h-4 w-4" />}
              values={destinations.map((d, i) => (
                <span className={cn(i === lowestFlightIndex && 'text-success font-semibold')}>
                  ${d.flightCost}
                </span>
              ))}
              highlightBest="lowest"
              bestIndex={lowestFlightIndex}
            />
            
            <ComparisonRow
              label="Hotel Cost"
              icon={<Building2 className="h-4 w-4" />}
              values={destinations.map((d, i) => (
                <span className={cn(i === lowestHotelIndex && 'text-success font-semibold')}>
                  ${d.accommodationCost}
                </span>
              ))}
              highlightBest="lowest"
              bestIndex={lowestHotelIndex}
            />
            
            <ComparisonRow
              label="Activities"
              icon={<Activities className="h-4 w-4" />}
              values={destinations.map(d => `$${d.activitiesCost}`)}
            />
            
            <ComparisonRow
              label="Food Budget"
              icon={<Utensils className="h-4 w-4" />}
              values={destinations.map(d => `$${d.foodCost}`)}
            />
            
            <ComparisonRow
              label="Daily Cost"
              icon={<Bus className="h-4 w-4" />}
              values={destinations.map(d => `$${d.dailyCost}/day`)}
            />
            
            {/* Scores Section */}
            <div className="bg-muted/30 px-3 py-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Scores & Ratings
              </span>
            </div>
            
            <ComparisonRow
              label="Value Score"
              icon={<TrendingUp className="h-4 w-4 text-primary" />}
              values={destinations.map((d, i) => (
                <ScoreBar score={d.valueScore} delay={0.2 + i * 0.1} />
              ))}
            />
            
            <ComparisonRow
              label="Confidence"
              icon={<Star className="h-4 w-4 text-warning" />}
              values={destinations.map(d => (
                <div className="flex items-center justify-center gap-1">
                  <span className="font-semibold">{d.confidenceScore}%</span>
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={cn(
                          'h-3 w-3',
                          star <= Math.round(d.confidenceScore / 20)
                            ? 'fill-warning text-warning'
                            : 'text-muted'
                        )}
                      />
                    ))}
                  </div>
                </div>
              ))}
            />
            
            <ComparisonRow
              label="Weather"
              icon={<Sun className="h-4 w-4 text-warning" />}
              values={destinations.map((d, i) => (
                <div className="flex flex-col items-center gap-1">
                  <ScoreBar score={d.weatherScore} delay={0.3 + i * 0.1} />
                  <span className="text-xs text-muted-foreground">
                    {d.weatherScore >= 75 ? 'Excellent' : d.weatherScore >= 50 ? 'Good' : 'Variable'}
                  </span>
                </div>
              ))}
              highlightBest="highest"
              bestIndex={bestWeatherIndex}
            />
            
            <ComparisonRow
              label="Crowd Level"
              icon={<Users className="h-4 w-4" />}
              values={destinations.map((d, i) => (
                <div className={cn(
                  'px-2 py-1 rounded-full text-xs font-medium',
                  d.crowdScore >= 70 
                    ? 'bg-success/10 text-success' 
                    : d.crowdScore >= 40 
                    ? 'bg-warning/10 text-warning' 
                    : 'bg-destructive/10 text-destructive'
                )}>
                  {d.crowdScore >= 70 ? 'Low' : d.crowdScore >= 40 ? 'Moderate' : 'High'}
                </div>
              ))}
              highlightBest="highest"
              bestIndex={leastCrowdedIndex}
            />
            
            {/* Best For Section */}
            <div className="bg-muted/30 px-3 py-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Highlights
              </span>
            </div>
            
            <ComparisonRow
              label="Best For"
              values={destinations.map(d => (
                <div className="flex flex-wrap gap-1 justify-center">
                  {d.bestFor.slice(0, 3).map((item, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {item}
                    </Badge>
                  ))}
                </div>
              ))}
            />
            
            <ComparisonRow
              label="Top Attractions"
              values={destinations.map(d => (
                <ul className="text-xs text-left space-y-1 list-none">
                  {d.highlights.slice(0, 3).map((h, i) => (
                    <li key={i} className="truncate max-w-[140px]">
                      • {h}
                    </li>
                  ))}
                </ul>
              ))}
            />
            
            {/* Pros & Cons */}
            <ProsConsSection destinations={destinations} />
          </div>
          
          {/* Smart Insights */}
          <SmartInsights destinations={destinations} />
          
          {/* Action Buttons */}
          <div 
            className="grid gap-4 mt-6 pt-4 border-t border-border"
            style={{ gridTemplateColumns: `160px repeat(${destinations.length}, 1fr)` }}
          >
            <div className="text-sm text-muted-foreground flex items-center">
              Choose your trip:
            </div>
            {destinations.map((dest) => (
              <motion.div
                key={dest.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  onClick={() => onSelect(dest)}
                  className="w-full group"
                  size="lg"
                >
                  Choose {dest.name}
                  <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
