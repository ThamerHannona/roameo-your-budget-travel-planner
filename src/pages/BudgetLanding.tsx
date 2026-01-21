import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Compass, ArrowRight, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';
import {
  AnimatedGlobe,
  BudgetSlider,
  DurationChips,
  RegionSelector,
  TravelStylePicker,
  BudgetPreview,
  DepartureCityInput,
  FlexibleDatePicker,
} from '@/components/budget';
import { useTripSearchStore, getBudgetPerDay } from '@/stores/tripSearchStore';

const BudgetLanding = () => {
  const navigate = useNavigate();
  const store = useTripSearchStore();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const budgetPerDay = getBudgetPerDay(store.budget, store.days);

  const handleSubmit = () => {
    const newErrors: Record<string, string> = {};
    
    if (store.budget < 500) newErrors.budget = 'Minimum budget is $500';
    if (store.days < 3) newErrors.days = 'Minimum trip length is 3 days';
    if (!store.departureCity.trim()) newErrors.city = 'Please enter a departure city';

    setErrors(newErrors);
    
    if (Object.keys(newErrors).length === 0) {
      navigate('/discover');
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-muted pointer-events-none" />
      <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-primary/5 blur-3xl rounded-full pointer-events-none" />
      
      <div className="relative z-10">
        {/* Header */}
        <header className="container mx-auto px-4 py-6 flex items-center justify-between">
          <Logo size="md" />
          <ThemeToggle />
        </header>

        {/* Hero */}
        <main className="container mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10"
          >
            <div className="flex justify-center mb-6">
              <AnimatedGlobe size="lg" />
            </div>
            
            <h1 className="text-3xl md:text-5xl font-display font-bold text-foreground mb-4">
              Don't know where to go?
              <br />
              <span 
                style={{
                  background: 'linear-gradient(135deg, #a78bfa 0%, #e879f9 50%, #38bdf8 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >Start with what you can spend.</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Enter your budget and we'll discover every destination you can afford.
            </p>
          </motion.div>

          {/* Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-3xl mx-auto space-y-8"
          >
            {/* Budget */}
            <div className="bg-card rounded-2xl p-6 border border-border shadow-sm">
              <BudgetSlider
                value={store.budget}
                onChange={store.setBudget}
                budgetPerDay={budgetPerDay}
              />
            </div>

            {/* Duration */}
            <DurationChips value={store.days} onChange={store.setDays} />

            {/* Preview */}
            <BudgetPreview budget={store.budget} days={store.days} />

            {/* City & Dates */}
            <div className="grid md:grid-cols-2 gap-6">
              <DepartureCityInput
                value={store.departureCity}
                onChange={store.setDepartureCity}
                error={errors.city}
              />
              <FlexibleDatePicker
                startDate={store.dates.start}
                endDate={store.dates.end}
                flexible={store.dates.flexible}
                onDatesChange={store.setDates}
                onFlexibleChange={store.setFlexibleDates}
              />
            </div>

            {/* Travelers */}
            <div className="flex items-center gap-4">
              <Users className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium">Travelers</span>
              <Input
                type="number"
                min={1}
                max={10}
                value={store.travelers}
                onChange={(e) => store.setTravelers(parseInt(e.target.value) || 1)}
                className="w-20 h-10 text-center"
              />
            </div>

            {/* Regions */}
            <RegionSelector selected={store.regions} onToggle={store.toggleRegion} />

            {/* Travel Style */}
            <TravelStylePicker value={store.travelStyle} onChange={store.setTravelStyle} />

            {/* CTA */}
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                onClick={handleSubmit}
                size="lg"
                className="w-full h-16 text-xl font-bold gap-3 text-white"
                style={{
                  background: 'linear-gradient(135deg, #a78bfa 0%, #e879f9 50%, #38bdf8 100%)',
                }}
              >
                <Compass className="h-6 w-6" />
                Discover Destinations
                <ArrowRight className="h-6 w-6" />
              </Button>
            </motion.div>
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default BudgetLanding;
