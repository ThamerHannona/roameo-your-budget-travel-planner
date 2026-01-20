import { Check, AlertTriangle } from 'lucide-react';
import { DestinationMatch } from '@/types/destination';

interface ProsConsSectionProps {
  destinations: DestinationMatch[];
}

function generatePros(dest: DestinationMatch): string[] {
  const pros: string[] = [];
  
  if (dest.valueScore >= 70) pros.push('Excellent value for money');
  if (dest.weatherScore >= 75) pros.push('Great weather during your dates');
  if (dest.crowdScore >= 70) pros.push('Less crowded destination');
  if (dest.budgetDelta > 300) pros.push(`$${dest.budgetDelta} under budget`);
  if (dest.confidenceScore >= 85) pros.push('Highly recommended for your style');
  if (dest.flightCost < 400) pros.push('Affordable flights');
  
  // Add from bestFor
  dest.bestFor.slice(0, 2).forEach(item => {
    pros.push(`Great for ${item}`);
  });
  
  return pros.slice(0, 3);
}

function generateCons(dest: DestinationMatch): string[] {
  const cons: string[] = [];
  
  if (dest.weatherScore < 60) cons.push('Weather may be unpredictable');
  if (dest.crowdScore < 40) cons.push('Can be crowded');
  if (dest.flightCost > 600) cons.push('Higher flight costs');
  if (dest.budgetDelta < 0) cons.push(`$${Math.abs(dest.budgetDelta)} over budget`);
  if (dest.valueScore < 50) cons.push('Lower value score');
  
  return cons.slice(0, 2);
}

export function ProsConsSection({ destinations }: ProsConsSectionProps) {
  return (
    <div 
      className="grid gap-4 py-4" 
      style={{ gridTemplateColumns: `160px repeat(${destinations.length}, 1fr)` }}
    >
      <div className="text-sm font-medium text-muted-foreground">
        Pros & Cons
      </div>
      {destinations.map((dest) => {
        const pros = generatePros(dest);
        const cons = generateCons(dest);
        
        return (
          <div key={dest.id} className="space-y-3">
            <div className="space-y-1.5">
              {pros.map((pro, i) => (
                <div key={i} className="flex items-start gap-1.5 text-xs">
                  <Check className="h-3.5 w-3.5 text-success mt-0.5 flex-shrink-0" />
                  <span className="text-foreground">{pro}</span>
                </div>
              ))}
            </div>
            <div className="space-y-1.5">
              {cons.map((con, i) => (
                <div key={i} className="flex items-start gap-1.5 text-xs">
                  <AlertTriangle className="h-3.5 w-3.5 text-warning mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">{con}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
