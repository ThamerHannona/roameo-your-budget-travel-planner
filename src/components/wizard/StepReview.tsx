import { motion } from 'framer-motion';
import { format, differenceInDays } from 'date-fns';
import {
  MapPin,
  Calendar,
  Users,
  DollarSign,
  Sparkles,
  Plane,
  Hotel,
  Map,
  Utensils,
  Train,
  Shield,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { TRIP_INTERESTS } from '@/types/trip';
import type { TripBasics, TripPreferences, BudgetBreakdown } from '@/types/trip';

interface StepReviewProps {
  basics: TripBasics;
  preferences: TripPreferences;
}

const categoryIcons: Record<keyof BudgetBreakdown, typeof Plane> = {
  flights: Plane,
  accommodation: Hotel,
  activities: Map,
  food: Utensils,
  transportation: Train,
  buffer: Shield,
};

const categoryLabels: Record<keyof BudgetBreakdown, string> = {
  flights: 'Flights',
  accommodation: 'Accommodation',
  activities: 'Activities',
  food: 'Food & Dining',
  transportation: 'Local Transport',
  buffer: 'Buffer',
};

const styleLabels = {
  budget: 'Budget Backpacker',
  balanced: 'Balanced Explorer',
  comfort: 'Comfort Seeker',
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export function StepReview({ basics, preferences }: StepReviewProps) {
  const tripDays = basics.startDate && basics.endDate
    ? differenceInDays(basics.endDate, basics.startDate) + 1
    : 0;

  const dailyBudget = tripDays > 0
    ? Math.round(preferences.totalBudget / tripDays)
    : 0;

  const selectedInterests = TRIP_INTERESTS.filter((i) =>
    preferences.interests.includes(i.id)
  );

  const getDollarAmount = (percentage: number) => {
    return Math.round((preferences.totalBudget * percentage) / 100);
  };

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
        <div className="inline-flex items-center gap-2 bg-success/10 text-success px-4 py-2 rounded-full text-sm font-medium mb-4">
          <Check className="h-4 w-4" />
          Ready to generate your trip!
        </div>
        <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-2">
          Review your trip details
        </h2>
        <p className="text-muted-foreground">
          Make sure everything looks good before we create your personalized itinerary
        </p>
      </motion.div>

      {/* Trip Overview Card */}
      <motion.div
        variants={itemVariants}
        className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-2xl p-6"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Your Trip</p>
            <h3 className="text-xl md:text-2xl font-display font-bold text-foreground">
              {basics.origin.split(',')[0]} → {basics.destination.split(',')[0]}
            </h3>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 bg-card px-3 py-2 rounded-lg">
              <Calendar className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground">{tripDays} days</span>
            </div>
            <div className="flex items-center gap-2 bg-card px-3 py-2 rounded-lg">
              <Users className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground">
                {basics.travelers} traveler{basics.travelers > 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex items-center gap-2 bg-card px-3 py-2 rounded-lg">
              <DollarSign className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground">
                ${preferences.totalBudget.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Details Grid */}
      <motion.div variants={itemVariants} className="grid md:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-4">
          {/* Dates */}
          <div className="bg-card rounded-xl p-5 border border-border">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="h-5 w-5 text-primary" />
              <h4 className="font-display font-semibold text-foreground">Travel Dates</h4>
            </div>
            <p className="text-foreground">
              {basics.startDate && format(basics.startDate, 'MMM d, yyyy')}
              {' – '}
              {basics.endDate && format(basics.endDate, 'MMM d, yyyy')}
            </p>
            {basics.flexibleDates && (
              <p className="text-sm text-muted-foreground mt-1">
                ± 3 days flexible
              </p>
            )}
          </div>

          {/* Style & Interests */}
          <div className="bg-card rounded-xl p-5 border border-border">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-5 w-5 text-primary" />
              <h4 className="font-display font-semibold text-foreground">Trip Style</h4>
            </div>
            <p className="text-foreground font-medium mb-3">
              {styleLabels[preferences.tripStyle]}
            </p>
            <div className="flex flex-wrap gap-2">
              {selectedInterests.map((interest) => (
                <span
                  key={interest.id}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-muted rounded-full text-sm text-foreground"
                >
                  <span>{interest.icon}</span>
                  {interest.label}
                </span>
              ))}
              {selectedInterests.length === 0 && (
                <span className="text-sm text-muted-foreground">No interests selected</span>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Budget Breakdown */}
        <div className="bg-card rounded-xl p-5 border border-border">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              <h4 className="font-display font-semibold text-foreground">Budget Breakdown</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              ~${dailyBudget}/day
            </p>
          </div>
          <div className="space-y-3">
            {(Object.keys(preferences.budgetBreakdown) as (keyof BudgetBreakdown)[]).map((key) => {
              const Icon = categoryIcons[key];
              const percentage = preferences.budgetBreakdown[key];
              const amount = getDollarAmount(percentage);

              return (
                <div key={key} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-foreground">{categoryLabels[key]}</span>
                  </div>
                  <span className="font-medium text-foreground">
                    ${amount.toLocaleString()}
                    <span className="text-muted-foreground ml-1 text-xs">
                      ({percentage}%)
                    </span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
