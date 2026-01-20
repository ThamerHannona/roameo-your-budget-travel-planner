import { motion } from 'framer-motion';
import { MapPin, Award } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DestinationMatch } from '@/types/destination';
import { cn } from '@/lib/utils';

interface ComparisonHeaderProps {
  destinations: DestinationMatch[];
  bestValueIndex: number;
}

export function ComparisonHeader({ destinations, bestValueIndex }: ComparisonHeaderProps) {
  return (
    <div 
      className="grid gap-4 mb-6" 
      style={{ gridTemplateColumns: `160px repeat(${destinations.length}, 1fr)` }}
    >
      <div className="font-medium text-muted-foreground text-sm">
        Comparing {destinations.length} destinations
      </div>
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
              className="w-full h-28 object-cover rounded-xl shadow-md"
            />
            {bestValueIndex === i && (
              <Badge className="absolute -top-2 -right-2 bg-success text-success-foreground gap-1">
                <Award className="h-3 w-3" />
                Best Value
              </Badge>
            )}
          </div>
          <div className="flex items-center justify-center gap-1 mb-1">
            <span className="text-lg">{dest.flagEmoji}</span>
            <h3 className="font-display font-bold text-foreground">{dest.name}</h3>
          </div>
          <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
            <MapPin className="h-3 w-3" />
            {dest.country}
          </p>
        </motion.div>
      ))}
    </div>
  );
}
