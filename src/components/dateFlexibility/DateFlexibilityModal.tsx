import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, addMonths, subMonths, addDays } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar, X, TrendingDown } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FlexibilityCalendar } from './FlexibilityCalendar';
import { PriceTrendChart } from './PriceTrendChart';
import { SavingsHighlights } from './SavingsHighlights';
import { QuickSelectButtons } from './QuickSelectButtons';
import {
  generatePriceData,
  generatePriceTrends,
  findSavingsHighlights,
  generateQuickSelectOptions,
} from '@/data/mockPriceData';
import type { DateRange, SavingsHighlight, QuickSelectOption } from '@/types/dateFlexibility';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface DateFlexibilityModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  destinationName: string;
  currentDates: DateRange;
  currentPrice: number;
  baseFlightPrice?: number;
  baseHotelPrice?: number;
  onUpdateDates: (newDates: DateRange, newPrice: number) => void;
}

export function DateFlexibilityModal({
  open,
  onOpenChange,
  destinationName,
  currentDates,
  currentPrice,
  baseFlightPrice = 450,
  baseHotelPrice = 800,
  onUpdateDates,
}: DateFlexibilityModalProps) {
  const isMobile = useIsMobile();
  const tripDuration = Math.ceil(
    (currentDates.end.getTime() - currentDates.start.getTime()) / (1000 * 60 * 60 * 24)
  ) + 1;

  // Calendar navigation
  const [viewMonth, setViewMonth] = useState(currentDates.start);
  
  // Selected range (may differ from current)
  const [selectedRange, setSelectedRange] = useState<DateRange>(currentDates);
  const [selectedPrice, setSelectedPrice] = useState(currentPrice);

  // Generate price data
  const priceData = useMemo(() => {
    return generatePriceData(
      subMonths(new Date(), 1), // Start from a month ago
      baseFlightPrice,
      baseHotelPrice
    );
  }, [baseFlightPrice, baseHotelPrice]);

  // Generate trends for chart
  const priceTrends = useMemo(() => {
    return generatePriceTrends(priceData, tripDuration);
  }, [priceData, tripDuration]);

  // Generate savings highlights
  const savingsHighlights = useMemo(() => {
    return findSavingsHighlights(priceData, currentPrice, tripDuration, destinationName);
  }, [priceData, currentPrice, tripDuration, destinationName]);

  // Generate quick select options
  const quickSelectOptions = useMemo(() => {
    return generateQuickSelectOptions(priceData, tripDuration);
  }, [priceData, tripDuration]);

  // Best deal date for chart marker
  const bestDealDate = savingsHighlights.find(h => h.type === 'best-deal')?.dateRange?.start;

  // Handle date click
  const handleDateClick = useCallback((date: Date) => {
    const newRange: DateRange = {
      start: date,
      end: addDays(date, tripDuration - 1),
    };
    setSelectedRange(newRange);
    
    // Find price for this date
    const datePrice = priceData.find(
      p => format(p.date, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    );
    if (datePrice) {
      setSelectedPrice(datePrice.totalPrice);
    }
  }, [tripDuration, priceData]);

  // Handle quick select
  const handleQuickSelect = useCallback((option: QuickSelectOption) => {
    setSelectedRange(option.dateRange);
    setSelectedPrice(option.price);
    setViewMonth(option.dateRange.start);
  }, []);

  // Handle highlight click
  const handleHighlightClick = useCallback((highlight: SavingsHighlight) => {
    if (highlight.dateRange) {
      setSelectedRange(highlight.dateRange);
      if (highlight.price) {
        setSelectedPrice(highlight.price);
      }
      setViewMonth(highlight.dateRange.start);
    }
  }, []);

  // Handle update dates
  const handleUpdateDates = () => {
    onUpdateDates(selectedRange, selectedPrice);
    onOpenChange(false);
  };

  const savings = currentPrice - selectedPrice;
  const hasChanges = format(selectedRange.start, 'yyyy-MM-dd') !== format(currentDates.start, 'yyyy-MM-dd');

  const secondMonth = addMonths(viewMonth, 1);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(
        'max-w-5xl max-h-[90vh] overflow-y-auto p-0',
        isMobile && 'max-w-full h-[95vh] rounded-t-2xl'
      )}>
        {/* Header */}
        <DialogHeader className="sticky top-0 z-10 bg-card border-b border-border p-4 md:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <DialogTitle className="text-xl md:text-2xl font-display">
                Find Cheaper Dates for {destinationName}
              </DialogTitle>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {format(currentDates.start, 'MMM d')} - {format(currentDates.end, 'MMM d')}
                  </span>
                </div>
                <Badge variant="secondary">
                  Current: ${currentPrice.toLocaleString()}
                </Badge>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="p-4 md:p-6 space-y-6">
          {/* Quick Select */}
          <QuickSelectButtons
            options={quickSelectOptions}
            onSelect={handleQuickSelect}
            currentPrice={currentPrice}
          />

          {/* Main Content Grid */}
          <div className={cn(
            'grid gap-6',
            isMobile ? 'grid-cols-1' : 'grid-cols-[1fr,280px]'
          )}>
            {/* Calendar Section */}
            <div className="space-y-6">
              {/* Month Navigation */}
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setViewMonth(m => subMonths(m, 1))}
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <span className="font-medium text-foreground">
                  {format(viewMonth, 'MMMM')} - {format(secondMonth, 'MMMM yyyy')}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setViewMonth(m => addMonths(m, 1))}
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>

              {/* Two Month Calendars */}
              <div className={cn(
                'grid gap-6',
                isMobile ? 'grid-cols-1' : 'grid-cols-2'
              )}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={format(viewMonth, 'yyyy-MM')}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                  >
                    <FlexibilityCalendar
                      month={viewMonth}
                      prices={priceData}
                      selectedRange={selectedRange}
                      currentPrice={currentPrice}
                      onDateClick={handleDateClick}
                      tripDuration={tripDuration}
                    />
                  </motion.div>
                </AnimatePresence>

                {!isMobile && (
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={format(secondMonth, 'yyyy-MM')}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                    >
                      <FlexibilityCalendar
                        month={secondMonth}
                        prices={priceData}
                        selectedRange={selectedRange}
                        currentPrice={currentPrice}
                        onDateClick={handleDateClick}
                        tripDuration={tripDuration}
                      />
                    </motion.div>
                  </AnimatePresence>
                )}
              </div>

              {/* Price Chart */}
              <div className="bg-muted/30 rounded-xl p-4 border border-border">
                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-primary" />
                  Price Trends (60 Days)
                </h3>
                <PriceTrendChart
                  trends={priceTrends}
                  selectedRange={selectedRange}
                  currentPrice={currentPrice}
                  bestDealDate={bestDealDate}
                />
              </div>
            </div>

            {/* Sidebar - Savings Highlights */}
            <div className="space-y-4">
              <SavingsHighlights
                highlights={savingsHighlights}
                onHighlightClick={handleHighlightClick}
              />
            </div>
          </div>
        </div>

        {/* Bottom Action Bar */}
        <div className="sticky bottom-0 bg-card border-t border-border p-4 md:p-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Price Comparison */}
            <div className="flex items-center gap-4">
              {hasChanges ? (
                <>
                  <div className="text-center sm:text-left">
                    <p className="text-sm text-muted-foreground">New dates</p>
                    <p className="font-medium">
                      {format(selectedRange.start, 'MMM d')} - {format(selectedRange.end, 'MMM d')}
                    </p>
                  </div>
                  <div className="text-center sm:text-left">
                    <p className="text-sm text-muted-foreground">New price</p>
                    <p className="text-2xl font-bold text-foreground">
                      ${selectedPrice.toLocaleString()}
                    </p>
                  </div>
                  {savings > 0 && (
                    <Badge className="bg-success text-success-foreground text-lg px-3 py-1">
                      Save ${savings.toLocaleString()}
                    </Badge>
                  )}
                  {savings < 0 && (
                    <Badge variant="destructive" className="text-lg px-3 py-1">
                      +${Math.abs(savings).toLocaleString()}
                    </Badge>
                  )}
                </>
              ) : (
                <p className="text-muted-foreground">
                  Select different dates to compare prices
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                onClick={() => onOpenChange(false)}
              >
                Keep Original
              </Button>
              <Button
                onClick={handleUpdateDates}
                disabled={!hasChanges}
                className="bg-primary"
              >
                Update Dates
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
