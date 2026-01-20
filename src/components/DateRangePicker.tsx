import { useState } from 'react';
import { format, startOfDay } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface DateRangePickerProps {
  startDate: Date | undefined;
  endDate: Date | undefined;
  onStartDateChange: (date: Date | undefined) => void;
  onEndDateChange: (date: Date | undefined) => void;
  error?: string;
  className?: string;
}

export function DateRangePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  error,
  className,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const dateRange: DateRange | undefined = startDate
    ? { from: startDate, to: endDate }
    : undefined;

  const handleSelect = (range: DateRange | undefined) => {
    onStartDateChange(range?.from);
    onEndDateChange(range?.to);
    
    // Close popover when both dates are selected
    if (range?.from && range?.to) {
      setTimeout(() => setIsOpen(false), 300);
    }
  };

  return (
    <div className={cn('grid gap-2', className)}>
      <div className="flex items-center gap-2 mb-2">
        <CalendarIcon className="h-4 w-4 text-primary" />
        <label className="text-sm font-medium text-foreground">Travel Dates</label>
      </div>

      <Popover open={isOpen} onOpenChange={setIsOpen} modal={true}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className={cn(
              'h-12 justify-start text-left font-normal w-full',
              !dateRange && 'text-muted-foreground',
              error && 'border-destructive focus-visible:ring-destructive'
            )}
            onClick={() => setIsOpen(true)}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateRange?.from ? (
              dateRange.to ? (
                <>
                  {format(dateRange.from, 'MMM d, yyyy')} -{' '}
                  {format(dateRange.to, 'MMM d, yyyy')}
                </>
              ) : (
                format(dateRange.from, 'MMM d, yyyy')
              )
            ) : (
              <span>Select your travel dates</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-auto p-0 z-[100]" 
          align="start"
          sideOffset={8}
        >
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={startDate}
            selected={dateRange}
            onSelect={handleSelect}
            numberOfMonths={2}
            disabled={(date) => date < startOfDay(new Date())}
            className="p-3"
          />
        </PopoverContent>
      </Popover>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}
