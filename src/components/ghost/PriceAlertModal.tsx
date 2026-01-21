import { useState } from 'react';
import { Bell, Mail, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GhostTrip } from '@/types/ghostTrip';
import { useGhostTripStore } from '@/stores/ghostTripStore';
import { toast } from 'sonner';

interface PriceAlertModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trip: GhostTrip;
  userBudget: number;
}

export function PriceAlertModal({
  open,
  onOpenChange,
  trip,
  userBudget,
}: PriceAlertModalProps) {
  const [email, setEmail] = useState('');
  const [targetPrice, setTargetPrice] = useState(userBudget);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { trackTrip } = useGhostTripStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email');
      return;
    }

    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    
    trackTrip({
      destinationId: trip.id,
      destinationName: trip.name,
      targetPrice,
      email,
    });
    
    setIsSubmitting(false);
    onOpenChange(false);
    
    toast.success(`We'll alert you when ${trip.name} drops to $${targetPrice.toLocaleString()}`, {
      icon: <Bell className="h-4 w-4" />,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-warning" />
            Track Price for {trip.name}
          </DialogTitle>
          <DialogDescription>
            Get notified when prices drop to your target
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="target-price">Alert me when price drops to:</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                $
              </span>
              <Input
                id="target-price"
                type="number"
                value={targetPrice}
                onChange={(e) => setTargetPrice(parseInt(e.target.value) || 0)}
                className="pl-7"
                min={0}
                max={trip.estimatedTotalCost}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Current price: ${trip.estimatedTotalCost.toLocaleString()} • 
              Your budget: ${userBudget.toLocaleString()}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground">
            <p className="flex items-start gap-2">
              <Check className="h-4 w-4 text-success shrink-0 mt-0.5" />
              We'll monitor prices daily and email you when {trip.name} drops to your target price.
            </p>
          </div>

          <Button 
            type="submit" 
            className="w-full gap-2"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>Processing...</>
            ) : (
              <>
                <Bell className="h-4 w-4" />
                Track This Price
              </>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
