import { motion } from 'framer-motion';
import { Users, Calendar } from 'lucide-react';
import { CityAutocomplete } from '@/components/CityAutocomplete';
import { DateRangePicker } from '@/components/DateRangePicker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import type { TripBasics } from '@/types/trip';

interface StepWhereWhenProps {
  data: TripBasics;
  onChange: (data: TripBasics) => void;
  errors: Record<string, string>;
  onClearError: (field: string) => void;
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export function StepWhereWhen({ data, onChange, errors, onClearError }: StepWhereWhenProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
      }}
      className="space-y-6"
    >
      <motion.div variants={itemVariants} className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-2">
          Where are you headed?
        </h2>
        <p className="text-muted-foreground">
          Tell us about your trip and we'll find the perfect options
        </p>
      </motion.div>

      {/* Origin & Destination */}
      <motion.div variants={itemVariants} className="grid md:grid-cols-2 gap-4 md:gap-6">
        <CityAutocomplete
          value={data.origin}
          onChange={(val) => {
            onChange({ ...data, origin: val });
            onClearError('origin');
          }}
          label="From"
          placeholder="Los Angeles, CA"
          error={errors.origin}
        />

        <CityAutocomplete
          value={data.destination}
          onChange={(val) => {
            onChange({ ...data, destination: val });
            onClearError('destination');
          }}
          label="To"
          placeholder="Tokyo, Japan"
          error={errors.destination}
        />
      </motion.div>

      {/* Date Range */}
      <motion.div variants={itemVariants}>
        <DateRangePicker
          startDate={data.startDate}
          endDate={data.endDate}
          onStartDateChange={(date) => {
            onChange({ ...data, startDate: date });
            onClearError('dates');
          }}
          onEndDateChange={(date) => {
            onChange({ ...data, endDate: date });
            onClearError('dates');
          }}
          error={errors.dates}
        />
      </motion.div>

      {/* Flexible dates checkbox */}
      <motion.div variants={itemVariants} className="flex items-center gap-3">
        <Checkbox
          id="flexibleDates"
          checked={data.flexibleDates}
          onCheckedChange={(checked) => 
            onChange({ ...data, flexibleDates: checked as boolean })
          }
        />
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" />
          <Label
            htmlFor="flexibleDates"
            className="text-sm font-medium cursor-pointer text-foreground"
          >
            My dates are flexible (±3 days)
          </Label>
        </div>
      </motion.div>

      {/* Travelers */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center gap-2 mb-2">
          <Users className="h-4 w-4 text-primary" />
          <Label className="text-sm font-medium text-foreground">Travelers</Label>
        </div>
        <Input
          type="number"
          value={data.travelers}
          onChange={(e) =>
            onChange({
              ...data,
              travelers: Math.max(1, Math.min(10, parseInt(e.target.value) || 1)),
            })
          }
          className="h-12 max-w-32"
          min={1}
          max={10}
        />
        <p className="text-xs text-muted-foreground mt-1">
          How many people are traveling?
        </p>
      </motion.div>
    </motion.div>
  );
}
