import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, Users, Calendar, MapPin, Sparkles } from 'lucide-react';
import { GenericDayCard } from './GenericDayCard';
import { LockedDayCard } from './LockedDayCard';
import { PaywallModal } from './PaywallModal';
import { usePaymentStore } from '@/stores/paymentStore';
import { createPaywallItinerary, getPaywallTripTotals } from '@/data/paywallItinerary';
import type { PaywallDayItinerary, PaywallTripDetails } from '@/types/paywall';
import { useToast } from '@/hooks/use-toast';
import confetti from 'canvas-confetti';

interface PaywallItineraryProps {
  destination: string;
  country: string;
  travelers: number;
  startDate?: Date;
}

export function PaywallItinerary({ destination, country, travelers, startDate }: PaywallItineraryProps) {
  const [showPaywall, setShowPaywall] = useState(false);
  const [days, setDays] = useState<PaywallDayItinerary[]>([]);
  const { isPaid, checkPaymentStatus, markAsPaid } = usePaymentStore();
  const { toast } = useToast();

  // Check payment status on mount
  useEffect(() => {
    const hasPaid = checkPaymentStatus(destination);
    if (hasPaid) {
      usePaymentStore.setState({ isPaid: true });
    }
  }, [destination, checkPaymentStatus]);

  // Generate itinerary
  useEffect(() => {
    const itinerary = createPaywallItinerary(startDate || new Date());
    
    // If paid, unlock all days
    if (isPaid) {
      setDays(itinerary.map(day => ({ ...day, isLocked: false })));
    } else {
      setDays(itinerary);
    }
  }, [startDate, isPaid]);

  const handlePaymentSuccess = () => {
    markAsPaid(destination);
    setShowPaywall(false);
    
    // Celebration!
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });

    toast({
      title: '🎉 Full Itinerary Unlocked!',
      description: 'All specific details, booking links, and options are now available.',
    });
  };

  const { totalSpent, byCategory } = getPaywallTripTotals(days);

  const tripDetails: PaywallTripDetails = {
    destination,
    country,
    days: days.length,
    totalCost: totalSpent,
    travelers,
  };

  return (
    <div className="space-y-6">
      {/* Trip Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-2xl p-6"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-1">
              Your {days.length}-Day {destination} Adventure
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {destination}, {country}
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {travelers} {travelers === 1 ? 'traveler' : 'travelers'}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {days.length} days
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-background/80 backdrop-blur-sm rounded-xl px-4 py-3 border border-border">
            <DollarSign className="h-5 w-5 text-emerald-600" />
            <div>
              <p className="text-xs text-muted-foreground">Total Trip Cost</p>
              <p className="text-xl font-bold text-foreground">${totalSpent.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Paid badge */}
        {isPaid && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-sm font-medium"
          >
            <Sparkles className="h-4 w-4" />
            Full Access Unlocked
          </motion.div>
        )}
      </motion.div>

      {/* Days */}
      <div className="space-y-4">
        {days.map((day) => {
          // Days 1-2 are always visible with generic content
          // Days 3+ are locked until payment
          if (!day.isLocked || isPaid) {
            return (
              <GenericDayCard 
                key={day.id} 
                day={day} 
                isPaid={isPaid}
              />
            );
          } else {
            return (
              <LockedDayCard
                key={day.id}
                day={day}
                onClick={() => setShowPaywall(true)}
              />
            );
          }
        })}
      </div>

      {/* Paywall CTA for free users */}
      {!isPaid && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky bottom-4 z-20"
        >
          <button
            onClick={() => setShowPaywall(true)}
            className="w-full p-4 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-semibold text-lg shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            🔓 Unlock Full Itinerary - $9.99
          </button>
        </motion.div>
      )}

      {/* Paywall Modal */}
      <PaywallModal
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        onPaymentSuccess={handlePaymentSuccess}
        tripDetails={tripDetails}
      />
    </div>
  );
}
