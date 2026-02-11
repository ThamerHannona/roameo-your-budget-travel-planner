import { motion } from 'framer-motion';
import { Calendar, MapPin, Users, DollarSign, Pencil, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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
  isLiveData?: boolean;
  hasMockData?: boolean;
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
  isLiveData = false,
  hasMockData = true,
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
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge 
                  variant="outline" 
                  className={`gap-1.5 py-1.5 px-3 text-xs font-medium cursor-default ${
                    isLiveData && !hasMockData
                      ? 'bg-success/10 text-success border-success/30'
                      : hasMockData && isLiveData
                      ? 'bg-warning/10 text-warning border-warning/30'
                      : 'bg-muted text-muted-foreground border-border'
                  }`}
                >
                  {isLiveData && !hasMockData ? (
                    <><Wifi className="h-3 w-3" /> Live prices</>
                  ) : hasMockData && isLiveData ? (
                    <><Wifi className="h-3 w-3" /> Partial live data</>
                  ) : (
                    <><WifiOff className="h-3 w-3" /> Estimated prices</>
                  )}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                {isLiveData && !hasMockData
                  ? 'All prices are from real-time API searches'
                  : hasMockData && isLiveData
                  ? 'Some prices are live, others are estimates'
                  : 'Prices are estimated — live search not available'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
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
