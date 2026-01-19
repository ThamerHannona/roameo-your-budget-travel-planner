import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, ArrowRight, Sparkles, AlertCircle } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { CityAutocomplete } from '@/components/CityAutocomplete';
import { DateRangePicker } from '@/components/DateRangePicker';
import { BudgetInput } from '@/components/BudgetInput';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTravel } from '@/context/TravelContext';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

interface FormErrors {
  origin?: string;
  destination?: string;
  dates?: string;
  budget?: string;
}

const Index = () => {
  const navigate = useNavigate();
  const { setSearch } = useTravel();
  
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [budget, setBudget] = useState(2000);
  const [travelers, setTravelers] = useState(1);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!origin.trim()) {
      newErrors.origin = 'Please enter your departure city';
    }

    if (!destination.trim()) {
      newErrors.destination = 'Please enter your destination';
    }

    if (origin.trim() && destination.trim() && 
        origin.trim().toLowerCase() === destination.trim().toLowerCase()) {
      newErrors.destination = 'Destination must be different from origin';
    }

    if (!startDate || !endDate) {
      newErrors.dates = 'Please select your travel dates';
    }

    if (budget < 100) {
      newErrors.budget = 'Minimum budget is $100';
    }

    if (budget > 100000) {
      newErrors.budget = 'Maximum budget is $100,000';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));

    setSearch({
      origin,
      destination,
      departureDate: startDate!.toISOString().split('T')[0],
      returnDate: endDate!.toISOString().split('T')[0],
      budget,
      travelers,
    });

    navigate('/results');
  };

  const hasErrors = Object.keys(errors).length > 0;

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-muted" />
      <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-primary/5 blur-3xl rounded-full" />
      <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-primary/5 blur-3xl rounded-full" />
      
      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="container mx-auto px-4 py-6">
          <Logo size="md" />
        </header>

        {/* Hero Section */}
        <main className="container mx-auto px-4 py-6 md:py-12 lg:py-16">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="max-w-2xl mx-auto"
          >
            {/* Hero Text */}
            <motion.div variants={itemVariants} className="text-center mb-8 md:mb-12">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
                <Sparkles className="h-4 w-4" />
                Budget-first travel planning
              </div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-foreground mb-4">
                Find trips that fit{' '}
                <span className="text-primary">your budget</span>
              </h1>
              <p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto">
                Set your budget first, then discover flights and hotels that fit. 
                Compare side-by-side and build your perfect trip.
              </p>
            </motion.div>

            {/* Search Form */}
            <motion.form
              variants={itemVariants}
              onSubmit={handleSubmit}
              className="bg-card rounded-2xl shadow-xl border border-border p-5 md:p-8"
            >
              {/* Error Summary */}
              {hasErrors && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-3"
                >
                  <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-destructive">Please fix the following errors:</p>
                    <ul className="text-sm text-destructive/80 mt-1 space-y-0.5">
                      {Object.values(errors).map((error, i) => (
                        <li key={i}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              )}

              {/* Budget Input - Prominent */}
              <div className="mb-8">
                <BudgetInput
                  value={budget}
                  onChange={(val) => {
                    setBudget(val);
                    if (errors.budget) setErrors(prev => ({ ...prev, budget: undefined }));
                  }}
                  error={errors.budget}
                />
              </div>

              {/* Origin & Destination */}
              <div className="grid md:grid-cols-2 gap-4 md:gap-6 mb-6">
                <CityAutocomplete
                  value={origin}
                  onChange={(val) => {
                    setOrigin(val);
                    if (errors.origin) setErrors(prev => ({ ...prev, origin: undefined }));
                  }}
                  label="From"
                  placeholder="Los Angeles, CA"
                  error={errors.origin}
                />

                <CityAutocomplete
                  value={destination}
                  onChange={(val) => {
                    setDestination(val);
                    if (errors.destination) setErrors(prev => ({ ...prev, destination: undefined }));
                  }}
                  label="To"
                  placeholder="New York, NY"
                  error={errors.destination}
                />
              </div>

              {/* Date Range & Travelers */}
              <div className="grid md:grid-cols-2 gap-4 md:gap-6 mb-8">
                <DateRangePicker
                  startDate={startDate}
                  endDate={endDate}
                  onStartDateChange={(date) => {
                    setStartDate(date);
                    if (errors.dates) setErrors(prev => ({ ...prev, dates: undefined }));
                  }}
                  onEndDateChange={(date) => {
                    setEndDate(date);
                    if (errors.dates) setErrors(prev => ({ ...prev, dates: undefined }));
                  }}
                  error={errors.dates}
                />

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4 text-primary" />
                    <Label className="text-sm font-medium text-foreground">Travelers</Label>
                  </div>
                  <Input
                    type="number"
                    value={travelers}
                    onChange={(e) => setTravelers(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
                    className="h-12"
                    min={1}
                    max={10}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                size="lg"
                disabled={isSubmitting}
                className="w-full h-14 text-lg font-display font-semibold bg-primary hover:bg-primary/90 text-primary-foreground transition-all"
              >
                {isSubmitting ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="mr-2 h-5 w-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full"
                    />
                    Searching...
                  </>
                ) : (
                  <>
                    Find Trips
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>
            </motion.form>

            {/* Features */}
            <motion.div
              variants={itemVariants}
              className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mt-10"
            >
              {[
                { title: 'Budget First', desc: 'See only options within your budget' },
                { title: 'Compare Easy', desc: 'Side-by-side flight & hotel comparison' },
                { title: 'Book Direct', desc: 'Links to airlines & hotels for best rates' },
              ].map((feature, i) => (
                <div key={i} className="text-center p-4 bg-card/50 rounded-xl border border-border/50">
                  <h3 className="font-display font-semibold text-foreground mb-1">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.desc}</p>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default Index;
