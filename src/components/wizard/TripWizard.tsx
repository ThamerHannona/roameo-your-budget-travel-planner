import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Sparkles, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WizardProgress } from './WizardProgress';
import { StepWhereWhen } from './StepWhereWhen';
import { StepBudgetStyle } from './StepBudgetStyle';
import { StepReview } from './StepReview';
import { useTravel } from '@/context/TravelContext';
import { DEFAULT_BUDGET_PERCENTAGES } from '@/types/trip';
import type { TripBasics, TripPreferences } from '@/types/trip';

const TOTAL_STEPS = 3;

type FormErrors = Record<string, string>;

export function TripWizard() {
  const navigate = useNavigate();
  const { setSearch } = useTravel();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [direction, setDirection] = useState(1); // 1 for forward, -1 for back

  // Step 1: Where & When
  const [basics, setBasics] = useState<TripBasics>({
    origin: '',
    destination: '',
    startDate: undefined,
    endDate: undefined,
    travelers: 1,
    flexibleDates: false,
  });

  // Step 2: Budget & Style
  const [preferences, setPreferences] = useState<TripPreferences>({
    totalBudget: 2000,
    tripStyle: 'balanced',
    interests: [],
    budgetBreakdown: { ...DEFAULT_BUDGET_PERCENTAGES },
  });

  const clearError = (field: string) => {
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validateStep1 = (): boolean => {
    const newErrors: FormErrors = {};

    if (!basics.origin.trim()) {
      newErrors.origin = 'Please enter your departure city';
    }

    if (!basics.destination.trim()) {
      newErrors.destination = 'Please enter your destination';
    }

    if (
      basics.origin.trim() &&
      basics.destination.trim() &&
      basics.origin.trim().toLowerCase() === basics.destination.trim().toLowerCase()
    ) {
      newErrors.destination = 'Destination must be different from origin';
    }

    if (!basics.startDate || !basics.endDate) {
      newErrors.dates = 'Please select your travel dates';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const newErrors: FormErrors = {};

    if (preferences.totalBudget < 100) {
      newErrors.budget = 'Minimum budget is $100';
    }

    if (preferences.totalBudget > 100000) {
      newErrors.budget = 'Maximum budget is $100,000';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (currentStep === 1 && !validateStep1()) return;
    if (currentStep === 2 && !validateStep2()) return;

    setDirection(1);
    setCurrentStep((prev) => Math.min(prev + 1, TOTAL_STEPS));
    setErrors({});
  };

  const handleBack = () => {
    setDirection(-1);
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    setErrors({});
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Store in context (using existing TravelSearch format for compatibility)
    setSearch({
      origin: basics.origin,
      destination: basics.destination,
      departureDate: basics.startDate!.toISOString().split('T')[0],
      returnDate: basics.endDate!.toISOString().split('T')[0],
      budget: preferences.totalBudget,
      travelers: basics.travelers,
    });

    // Navigate to results
    navigate('/results');
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 100 : -100,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction > 0 ? -100 : 100,
      opacity: 0,
    }),
  };

  const hasErrors = Object.keys(errors).length > 0;

  return (
    <div className="w-full max-w-3xl mx-auto relative z-20">
      <WizardProgress currentStep={currentStep} totalSteps={TOTAL_STEPS} />

      {/* Error Summary */}
      <AnimatePresence mode="wait">
        {hasErrors && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-3"
          >
            <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-destructive">Please fix the following:</p>
              <ul className="text-sm text-destructive/80 mt-1 space-y-0.5">
                {Object.values(errors).map((error, i) => (
                  <li key={i}>• {error}</li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Step Content */}
      <div className="bg-card rounded-2xl shadow-xl border border-border p-5 md:p-8 overflow-hidden relative isolate">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentStep}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            {currentStep === 1 && (
              <StepWhereWhen
                data={basics}
                onChange={setBasics}
                errors={errors}
                onClearError={clearError}
              />
            )}
            {currentStep === 2 && (
              <StepBudgetStyle
                data={preferences}
                onChange={setPreferences}
                errors={errors}
                onClearError={clearError}
                destination={basics.destination}
              />
            )}
            {currentStep === 3 && (
              <StepReview basics={basics} preferences={preferences} />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
          <Button
            type="button"
            variant="ghost"
            onClick={handleBack}
            disabled={currentStep === 1}
            className={currentStep === 1 ? 'invisible' : ''}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          {currentStep < TOTAL_STEPS ? (
            <Button
              type="button"
              onClick={handleNext}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Continue
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-primary hover:bg-primary/90 text-primary-foreground min-w-40"
            >
              {isSubmitting ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="mr-2 h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full"
                  />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate My Trip
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
