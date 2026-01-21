import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calculator, DollarSign, Calendar, Plane, Clock, 
  Sparkles, Check, X, TrendingDown
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { GhostTrip } from '@/types/ghostTrip';
import { calculateUnlockedPrice } from '@/lib/ghostTripUtils';
import { cn } from '@/lib/utils';

interface UnlockCalculatorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trip: GhostTrip;
  userBudget: number;
  currentDays: number;
  onApplyChanges?: (changes: UnlockChanges) => void;
}

interface UnlockChanges {
  budgetIncrease: number;
  reduceDays: number;
  selectedMonth: number | null;
  acceptLongerFlights: boolean;
  newPrice: number;
}

const months = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
];

// Off-season months for different destinations (simplified)
const offSeasonMonths = [1, 2, 9, 10, 11];

export function UnlockCalculatorModal({
  open,
  onOpenChange,
  trip,
  userBudget,
  currentDays,
  onApplyChanges,
}: UnlockCalculatorModalProps) {
  const [budgetIncrease, setBudgetIncrease] = useState(0);
  const [reduceDays, setReduceDays] = useState(0);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [acceptLongerFlights, setAcceptLongerFlights] = useState(false);

  const useOffSeason = selectedMonth !== null && offSeasonMonths.includes(selectedMonth);

  const calculatedPrice = useMemo(() => {
    return calculateUnlockedPrice(
      trip.estimatedTotalCost,
      budgetIncrease,
      reduceDays,
      trip.dailyCost,
      acceptLongerFlights,
      trip.flightCost,
      useOffSeason
    );
  }, [trip, budgetIncrease, reduceDays, acceptLongerFlights, useOffSeason]);

  const effectiveBudget = userBudget + budgetIncrease;
  const isAffordable = calculatedPrice <= effectiveBudget;
  const savingsFromChanges = trip.estimatedTotalCost - calculatedPrice;
  const remainingGap = calculatedPrice - effectiveBudget;

  const handleApply = () => {
    onApplyChanges?.({
      budgetIncrease,
      reduceDays,
      selectedMonth,
      acceptLongerFlights,
      newPrice: calculatedPrice,
    });
    onOpenChange(false);
  };

  const handleReset = () => {
    setBudgetIncrease(0);
    setReduceDays(0);
    setSelectedMonth(null);
    setAcceptLongerFlights(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-warning" />
            Unlock {trip.name}
          </DialogTitle>
          <DialogDescription>
            Adjust these options to see how you can make this trip affordable
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-2">
          {/* Current Status */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Original price:</span>
              <span className="font-medium">${trip.estimatedTotalCost.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Your budget:</span>
              <span className="font-medium">${userBudget.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm border-t pt-2">
              <span className="text-muted-foreground">Gap to close:</span>
              <span className="font-bold text-warning">
                ${trip.amountOver.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Adjustment Sliders */}
          <div className="space-y-5">
            {/* Budget Increase */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  Increase budget by
                </Label>
                <Badge variant="outline" className="font-mono">
                  +${budgetIncrease}
                </Badge>
              </div>
              <Slider
                value={[budgetIncrease]}
                onValueChange={([val]) => setBudgetIncrease(val)}
                max={500}
                step={25}
                className="py-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>$0</span>
                <span>$500</span>
              </div>
            </div>

            {/* Reduce Days */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  Reduce days by
                </Label>
                <Badge variant="outline" className="font-mono">
                  {reduceDays === 0 ? 'No change' : `-${reduceDays} days`}
                </Badge>
              </div>
              <Slider
                value={[reduceDays]}
                onValueChange={([val]) => setReduceDays(val)}
                max={Math.min(2, currentDays - 3)}
                step={1}
                className="py-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0 days</span>
                <span>2 days</span>
              </div>
              {reduceDays > 0 && (
                <p className="text-xs text-muted-foreground">
                  Saves ~${(reduceDays * trip.dailyCost).toLocaleString()} ({currentDays - reduceDays} day trip)
                </p>
              )}
            </div>

            {/* Off-Season Month */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                Choose cheaper month
              </Label>
              <Select
                value={selectedMonth?.toString() || 'none'}
                onValueChange={(val) => setSelectedMonth(val === 'none' ? null : parseInt(val))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Keep current dates" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Keep current dates</SelectItem>
                  {months.map((month) => (
                    <SelectItem key={month.value} value={month.value.toString()}>
                      {month.label}
                      {offSeasonMonths.includes(month.value) && (
                        <span className="ml-2 text-success text-xs">(off-season -18%)</span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {useOffSeason && (
                <p className="text-xs text-success">
                  🎉 Off-season discount: ~18% savings
                </p>
              )}
            </div>

            {/* Accept Longer Flights */}
            <div className="flex items-center justify-between py-2">
              <Label className="flex items-center gap-2 cursor-pointer">
                <Plane className="h-4 w-4 text-muted-foreground" />
                <span>Accept longer flights (1-2 stops)</span>
              </Label>
              <Switch
                checked={acceptLongerFlights}
                onCheckedChange={setAcceptLongerFlights}
              />
            </div>
            {acceptLongerFlights && (
              <p className="text-xs text-muted-foreground -mt-2 ml-6">
                Saves ~${Math.round(trip.flightCost * 0.15).toLocaleString()} on flights
              </p>
            )}
          </div>

          {/* Results */}
          <motion.div
            layout
            className={cn(
              'rounded-lg p-4 border-2 transition-colors',
              isAffordable 
                ? 'bg-success/10 border-success/30' 
                : 'bg-warning/10 border-warning/30'
            )}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={isAffordable ? 'affordable' : 'not-affordable'}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-3"
              >
                <div className="flex items-center gap-2">
                  {isAffordable ? (
                    <>
                      <div className="p-1.5 bg-success/20 rounded-full">
                        <Check className="h-4 w-4 text-success" />
                      </div>
                      <span className="font-semibold text-success">
                        It's affordable!
                      </span>
                    </>
                  ) : (
                    <>
                      <div className="p-1.5 bg-warning/20 rounded-full">
                        <TrendingDown className="h-4 w-4 text-warning" />
                      </div>
                      <span className="font-semibold text-warning">
                        ${remainingGap.toLocaleString()} more to go
                      </span>
                    </>
                  )}
                </div>

                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">New trip price:</span>
                    <span className="font-bold">${calculatedPrice.toLocaleString()}</span>
                  </div>
                  {savingsFromChanges > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Your savings:</span>
                      <span className="text-success font-medium">
                        -${savingsFromChanges.toLocaleString()}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Your new budget:</span>
                    <span className="font-medium">${effectiveBudget.toLocaleString()}</span>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </motion.div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={handleReset} className="flex-1">
              Reset
            </Button>
            <Button 
              onClick={handleApply} 
              disabled={!isAffordable}
              className={cn(
                'flex-1',
                isAffordable && 'bg-success hover:bg-success/90'
              )}
            >
              {isAffordable ? 'Apply Changes' : 'Keep Adjusting'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
