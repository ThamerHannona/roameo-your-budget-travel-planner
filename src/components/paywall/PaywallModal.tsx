import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Lock, Unlock, Plane, Hotel, Utensils, MapPin, Calendar, 
  Share2, RefreshCw, CheckCircle2, Loader2, Shield, CreditCard, Sparkles 
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { PaywallTripDetails } from '@/types/paywall';
import { cn } from '@/lib/utils';

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: () => void;
  tripDetails: PaywallTripDetails;
}

const features = [
  {
    icon: Plane,
    title: '3 Flight Options',
    description: 'Choose from budget, standard, or premium flights with exact times and booking links'
  },
  {
    icon: Hotel,
    title: '3 Hotel Tiers',
    description: 'Specific hotel names, addresses, photos, and direct booking links for each tier'
  },
  {
    icon: Utensils,
    title: 'Restaurant Details',
    description: 'Exact names, addresses, menus, phone numbers, and reservation links'
  },
  {
    icon: MapPin,
    title: 'Attraction Names & Tickets',
    description: 'Specific landmarks, skip-the-line tickets, and navigation links'
  },
  {
    icon: Calendar,
    title: 'Days 3-5 Revealed',
    description: 'Complete itinerary with all specific details for remaining days'
  },
  {
    icon: Share2,
    title: 'Export & Share',
    description: 'Download PDF, add to Google Calendar, share with travel companions'
  },
  {
    icon: RefreshCw,
    title: 'Unlimited Changes',
    description: 'Swap flights, hotels, and restaurants anytime. Budget updates in real-time'
  },
];

export function PaywallModal({ isOpen, onClose, onPaymentSuccess, tripDetails }: PaywallModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePayment = async () => {
    setIsProcessing(true);
    
    // Simulate payment processing
    // TODO: Integrate with Stripe
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsProcessing(false);
    onPaymentSuccess();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] p-0 overflow-hidden">
        <ScrollArea className="max-h-[90vh]">
          <div className="p-6">
            {/* Header */}
            <DialogHeader className="text-center mb-6">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="mx-auto mb-4"
              >
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                  <Unlock className="h-8 w-8 text-primary-foreground" />
                </div>
              </motion.div>
              <DialogTitle className="text-2xl font-display font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Unlock Your Complete {tripDetails.destination} Trip
              </DialogTitle>
              <p className="text-muted-foreground mt-2">
                You've planned the perfect {tripDetails.days}-day adventure
              </p>
            </DialogHeader>

            {/* What you have now */}
            <div className="mb-6">
              <h3 className="font-semibold text-foreground mb-3">What you have now:</h3>
              <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Complete {tripDetails.days}-day structure & timing</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Real budget breakdown (${tripDetails.totalCost.toLocaleString()})</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>General descriptions & categories</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Days 1-2 detailed preview</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <X className="h-4 w-4" />
                  <span>Specific restaurant names</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <X className="h-4 w-4" />
                  <span>Hotel names & addresses</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <X className="h-4 w-4" />
                  <span>Flight details & options</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <X className="h-4 w-4" />
                  <span>Days 3-{tripDetails.days} details</span>
                </div>
              </div>
            </div>

            {/* Unlock features */}
            <div className="mb-6">
              <h3 className="font-semibold text-foreground mb-3">Unlock to get:</h3>
              <div className="space-y-3">
                {features.map((feature, index) => (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex gap-3 p-3 rounded-lg bg-primary/5 border-l-4 border-primary"
                  >
                    <feature.icon className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-foreground text-sm">{feature.title}</p>
                      <p className="text-xs text-muted-foreground">{feature.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Pricing */}
            <div className="border-t border-dashed border-border pt-6 mb-4">
              <div className="bg-gradient-to-br from-primary to-primary/80 rounded-xl p-6 text-primary-foreground text-center mb-4">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <span className="text-lg line-through opacity-70">$49.99</span>
                  <span className="bg-white/20 text-xs font-bold px-2 py-1 rounded-full">80% OFF</span>
                </div>
                <div className="flex items-baseline justify-center gap-1 mb-1">
                  <span className="text-5xl font-bold">$9.99</span>
                  <span className="text-sm opacity-80">one-time</span>
                </div>
                <p className="text-sm opacity-80">No subscription. Pay once, keep forever.</p>
              </div>

              {/* Payment button */}
              <Button
                onClick={handlePayment}
                disabled={isProcessing}
                className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                size="lg"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Unlock className="h-5 w-5 mr-2" />
                    Unlock Full Itinerary - $9.99
                  </>
                )}
              </Button>

              {/* Guarantees */}
              <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Shield className="h-3 w-3" /> Secure payment
                </span>
                <span className="flex items-center gap-1">
                  <CreditCard className="h-3 w-3" /> No hidden fees
                </span>
                <span className="flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> Instant access
                </span>
              </div>
            </div>

            {/* Close option */}
            <Button
              variant="ghost"
              onClick={onClose}
              className="w-full text-muted-foreground hover:text-foreground"
            >
              I'll browse more destinations first
            </Button>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
