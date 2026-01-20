import { useState } from 'react';
import { format } from 'date-fns';
import { CalendarIcon, CalendarCheck2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';

interface FlexibleDatePickerProps {
  startDate: Date | null;
  endDate: Date | null;
  flexible: boolean;
  onDatesChange: (start: Date | null, end: Date | null) => void;
  onFlexibleChange: (flexible: boolean) => void;
  error?: string;
  className?: string;
}

export function FlexibleDatePicker({
  startDate,
  endDate,
  flexible,
  onDatesChange,
  onFlexibleChange,
  error,
  className,
}: FlexibleDatePickerProps) {
  const [open, setOpen] = useState(false);

  const handleSelect = (range: { from?: Date; to?: Date } | undefined) => {
    onDatesChange(range?.from ?? null, range?.to ?? null);
  };

  const formatDateRange = () => {
    if (startDate && endDate) {
      return `${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d, yyyy')}`;
    }
    if (startDate) {
      return `${format(startDate, 'MMM d, yyyy')} - Select end date`;
    }
    return 'Select your travel dates';
  };

  return (
    <div className={cn('space-y-3', className)}>
      <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
        <CalendarCheck2 className="h-4 w-4" />
        Travel Dates
      </label>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'w-full h-12 justify-start text-left font-normal',
              !startDate && 'text-muted-foreground',
              error && 'border-destructive'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {formatDateRange()}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            selected={{ from: startDate ?? undefined, to: endDate ?? undefined }}
            onSelect={handleSelect}
            numberOfMonths={2}
            disabled={{ before: new Date() }}
            className="p-3 pointer-events-auto"
          />
        </PopoverContent>
      </Popover>

      {/* Flexible dates checkbox */}
      <motion.label
        whileHover={{ scale: 1.01 }}
        className={cn(
          'flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all',
          flexible
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/50'
        )}
      >
        <Checkbox
          checked={flexible}
          onCheckedChange={(checked) => onFlexibleChange(checked as boolean)}
          className="h-5 w-5"
        />
        <div className="flex-1">
          <p className={cn('font-medium', flexible && 'text-primary')}>
            Flexible dates (±3 days)
          </p>
          <p className="text-xs text-muted-foreground">
            We'll search nearby dates to find better deals
          </p>
        </div>
        {flexible && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded-full"
          >
            Save up to 30%
          </motion.span>
        )}
      </motion.label>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}
