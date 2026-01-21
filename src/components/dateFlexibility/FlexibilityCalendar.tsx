import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isWithinInterval,
  addDays,
} from 'date-fns';
import { cn } from '@/lib/utils';
import type { DatePrice, DateRange, PriceCategory } from '@/types/dateFlexibility';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface FlexibilityCalendarProps {
  month: Date;
  prices: DatePrice[];
  selectedRange: DateRange;
  currentPrice: number;
  onDateClick: (date: Date) => void;
  tripDuration: number;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const getPriceCategory = (price: number, currentPrice: number): PriceCategory => {
  const ratio = price / currentPrice;
  if (ratio < 0.92) return 'cheaper';
  if (ratio <= 1.08) return 'similar';
  return 'expensive';
};

const categoryColors: Record<PriceCategory, string> = {
  cheaper: 'bg-success/20 hover:bg-success/30 text-success-foreground border-success/30',
  similar: 'bg-warning/20 hover:bg-warning/30 text-warning-foreground border-warning/30',
  expensive: 'bg-destructive/20 hover:bg-destructive/30 text-destructive-foreground border-destructive/30',
  unavailable: 'bg-muted/50 text-muted-foreground cursor-not-allowed',
};

const priceTextColors: Record<PriceCategory, string> = {
  cheaper: 'text-success',
  similar: 'text-warning',
  expensive: 'text-destructive',
  unavailable: 'text-muted-foreground',
};

export function FlexibilityCalendar({
  month,
  prices,
  selectedRange,
  currentPrice,
  onDateClick,
  tripDuration,
}: FlexibilityCalendarProps) {
  // Generate calendar days including padding from adjacent months
  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(month));
    const end = endOfWeek(endOfMonth(month));
    return eachDayOfInterval({ start, end });
  }, [month]);

  // Map prices to dates for quick lookup
  const priceMap = useMemo(() => {
    const map = new Map<string, DatePrice>();
    prices.forEach(p => {
      map.set(format(p.date, 'yyyy-MM-dd'), p);
    });
    return map;
  }, [prices]);

  const isInSelectedRange = (date: Date) => {
    return isWithinInterval(date, {
      start: selectedRange.start,
      end: selectedRange.end,
    });
  };

  const isRangeStart = (date: Date) => isSameDay(date, selectedRange.start);
  const isRangeEnd = (date: Date) => isSameDay(date, selectedRange.end);

  return (
    <div className="w-full">
      {/* Month Header */}
      <h3 className="text-center font-semibold text-foreground mb-4">
        {format(month, 'MMMM yyyy')}
      </h3>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {WEEKDAYS.map(day => (
          <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((date, index) => {
          const dateKey = format(date, 'yyyy-MM-dd');
          const priceData = priceMap.get(dateKey);
          const isCurrentMonth = isSameMonth(date, month);
          const isSelected = isInSelectedRange(date);
          const isStart = isRangeStart(date);
          const isEnd = isRangeEnd(date);

          if (!isCurrentMonth) {
            return (
              <div key={dateKey} className="aspect-square p-1" />
            );
          }

          const category: PriceCategory = priceData?.isAvailable 
            ? getPriceCategory(priceData.totalPrice, currentPrice)
            : 'unavailable';

          return (
            <Tooltip key={dateKey}>
              <TooltipTrigger asChild>
                <motion.button
                  whileHover={{ scale: priceData?.isAvailable ? 1.05 : 1 }}
                  whileTap={{ scale: priceData?.isAvailable ? 0.95 : 1 }}
                  onClick={() => priceData?.isAvailable && onDateClick(date)}
                  disabled={!priceData?.isAvailable}
                  className={cn(
                    'aspect-square p-1 rounded-lg border transition-all relative flex flex-col items-center justify-center gap-0.5',
                    categoryColors[category],
                    isSelected && 'ring-2 ring-primary ring-offset-1',
                    isStart && 'rounded-l-xl',
                    isEnd && 'rounded-r-xl',
                    !priceData?.isAvailable && 'opacity-50'
                  )}
                >
                  {/* Day Number */}
                  <span className={cn(
                    'text-sm font-medium',
                    isSelected ? 'text-primary' : 'text-foreground'
                  )}>
                    {format(date, 'd')}
                  </span>

                  {/* Price */}
                  {priceData?.isAvailable && (
                    <span className={cn(
                      'text-[10px] font-medium leading-none',
                      priceTextColors[category]
                    )}>
                      ${Math.round(priceData.totalPrice / 100) * 100 >= 1000 
                        ? `${(priceData.totalPrice / 1000).toFixed(1)}k`
                        : priceData.totalPrice}
                    </span>
                  )}

                  {/* Holiday indicator */}
                  {priceData?.isHoliday && (
                    <span className="absolute -top-1 -right-1 text-[10px]">🎉</span>
                  )}
                </motion.button>
              </TooltipTrigger>
              
              {priceData?.isAvailable && (
                <TooltipContent side="top" className="p-3">
                  <div className="space-y-1.5">
                    <p className="font-semibold">{format(date, 'EEEE, MMMM d')}</p>
                    {priceData.isHoliday && (
                      <p className="text-xs text-warning">{priceData.holidayName}</p>
                    )}
                    <div className="text-sm space-y-0.5">
                      <p>✈️ Flight: ${priceData.flightPrice}</p>
                      <p>🏨 Hotel: ${priceData.hotelPrice}</p>
                      <hr className="my-1 border-border" />
                      <p className="font-medium">Total: ${priceData.totalPrice}</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Click to select {tripDuration}-day trip starting here
                    </p>
                  </div>
                </TooltipContent>
              )}
            </Tooltip>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-4 mt-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-success/30" />
          <span className="text-muted-foreground">Cheaper</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-warning/30" />
          <span className="text-muted-foreground">Similar</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-destructive/30" />
          <span className="text-muted-foreground">More $</span>
        </div>
      </div>
    </div>
  );
}
