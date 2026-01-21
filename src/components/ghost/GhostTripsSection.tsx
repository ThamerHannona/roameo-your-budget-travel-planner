import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Ghost, Sparkles, TrendingUp } from 'lucide-react';
import { GhostTripCard } from './GhostTripCard';
import { UnlockCalculatorModal } from './UnlockCalculatorModal';
import { PriceAlertModal } from './PriceAlertModal';
import { getGhostTrips } from '@/lib/destinationMatcher';
import { convertToGhostTrip } from '@/lib/ghostTripUtils';
import { GhostTrip } from '@/types/ghostTrip';
import { useGhostTripStore } from '@/stores/ghostTripStore';

interface GhostTripsSectionProps {
  budget: number;
  startDate: Date;
  endDate: Date;
  travelers: number;
  tripStyle: 'budget' | 'mid' | 'luxury';
  days: number;
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export function GhostTripsSection({
  budget,
  startDate,
  endDate,
  travelers,
  tripStyle,
  days,
}: GhostTripsSectionProps) {
  const [selectedTrip, setSelectedTrip] = useState<GhostTrip | null>(null);
  const [showCalculator, setShowCalculator] = useState(false);
  const [showPriceAlert, setShowPriceAlert] = useState(false);
  const { isTracking } = useGhostTripStore();

  const ghostTrips: GhostTrip[] = useMemo(() => {
    const rawGhosts = getGhostTrips({
      budget,
      startDate,
      endDate,
      travelers,
      tripStyle,
    });

    return rawGhosts.map(trip => convertToGhostTrip(trip, budget, days));
  }, [budget, startDate, endDate, travelers, tripStyle, days]);

  if (ghostTrips.length === 0) {
    return null;
  }

  const handleOpenCalculator = (trip: GhostTrip) => {
    setSelectedTrip(trip);
    setShowCalculator(true);
  };

  const handleOpenPriceAlert = (trip: GhostTrip) => {
    setSelectedTrip(trip);
    setShowPriceAlert(true);
  };

  return (
    <section className="mt-12 border-t border-dashed border-warning/30 pt-8">
      {/* Section Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 mb-2"
      >
        <div className="p-2 bg-warning/10 rounded-lg">
          <Ghost className="h-5 w-5 text-warning" />
        </div>
        <div>
          <h2 className="font-display text-xl font-bold text-foreground flex items-center gap-2">
            💭 Almost Within Reach
          </h2>
          <p className="text-sm text-muted-foreground">
            These amazing trips are close to your budget
          </p>
        </div>
      </motion.div>

      {/* Ghost Cards Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mt-6"
      >
        {ghostTrips.map((trip) => (
          <motion.div key={trip.id} variants={itemVariants}>
            <GhostTripCard
              trip={trip}
              onUnlockCalculator={() => handleOpenCalculator(trip)}
              onTrackPrice={() => handleOpenPriceAlert(trip)}
              isTracking={isTracking(trip.id)}
            />
          </motion.div>
        ))}
      </motion.div>

      {/* Tip Banner */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-6 flex items-center gap-3 bg-gradient-to-r from-warning/5 to-transparent rounded-lg p-4 border border-warning/20"
      >
        <Sparkles className="h-5 w-5 text-warning shrink-0" />
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Pro tip:</span> Many of these trips become affordable 
          by booking 2-3 months in advance or traveling during shoulder season.
        </p>
      </motion.div>

      {/* Modals */}
      {selectedTrip && (
        <>
          <UnlockCalculatorModal
            open={showCalculator}
            onOpenChange={setShowCalculator}
            trip={selectedTrip}
            userBudget={budget}
            currentDays={days}
          />
          <PriceAlertModal
            open={showPriceAlert}
            onOpenChange={setShowPriceAlert}
            trip={selectedTrip}
            userBudget={budget}
          />
        </>
      )}
    </section>
  );
}
