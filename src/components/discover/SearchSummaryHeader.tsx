import { motion } from 'framer-motion';
import { Calendar, MapPin, Users, DollarSign, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface SearchSummaryHeaderProps {
  budget: number;
  days: number;
  startDate?: Date | null;
  endDate?: Date | null;
  departureCity: string;
  travelers: number;
  resultCount: number;
  onEdit: () => void;
}

export function SearchSummaryHeader({
  budget,
  days,
  startDate,
  endDate,
  departureCity,
  travelers,
  resultCount,
  onEdit,
}: SearchSummaryHeaderProps) {
  const dateRange = startDate && endDate 
    ? `${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d, yyyy')}`
    : `${days} days`;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-xl p-4 md:p-6 mb-6"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Summary Pills */}
        <div className="flex flex-wrap items-center gap-2 md:gap-3">
          <Badge variant="secondary" className="gap-1.5 py-1.5 px-3 text-sm font-medium">
            <DollarSign className="h-3.5 w-3.5" />
            ${budget.toLocaleString()} budget
          </Badge>
          
          <Badge variant="secondary" className="gap-1.5 py-1.5 px-3 text-sm font-medium">
            <Calendar className="h-3.5 w-3.5" />
            {dateRange}
          </Badge>
          
          {departureCity && (
            <Badge variant="secondary" className="gap-1.5 py-1.5 px-3 text-sm font-medium">
              <MapPin className="h-3.5 w-3.5" />
              From {departureCity}
            </Badge>
          )}
          
          {travelers > 1 && (
            <Badge variant="secondary" className="gap-1.5 py-1.5 px-3 text-sm font-medium">
              <Users className="h-3.5 w-3.5" />
              {travelers} travelers
            </Badge>
          )}
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-muted-foreground">
            {resultCount} destinations found
          </span>
          <Button variant="outline" size="sm" onClick={onEdit} className="gap-1.5">
            <Pencil className="h-3.5 w-3.5" />
            Edit Search
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
