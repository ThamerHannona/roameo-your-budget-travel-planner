import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step {
  id: number;
  label: string;
  path: string;
  patterns: string[];
}

const steps: Step[] = [
  {
    id: 1,
    label: 'Budget',
    path: '/',
    patterns: ['/'],
  },
  {
    id: 2,
    label: 'Discover',
    path: '/discover',
    patterns: ['/discover', '/compare'],
  },
  {
    id: 3,
    label: 'Customize',
    path: '/trip/:id/budget',
    patterns: ['/trip/*/budget'],
  },
  {
    id: 4,
    label: 'Itinerary',
    path: '/trip/:id/itinerary',
    patterns: ['/trip/*/itinerary'],
  },
];

function matchPattern(pathname: string, pattern: string): boolean {
  if (pattern.includes('*')) {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '[^/]+') + '$');
    return regex.test(pathname);
  }
  return pathname === pattern;
}

export function ProgressStepper() {
  const location = useLocation();
  
  // Determine current step
  const getCurrentStep = (): number => {
    for (const step of steps) {
      for (const pattern of step.patterns) {
        if (matchPattern(location.pathname, pattern)) {
          return step.id;
        }
      }
    }
    return 1;
  };
  
  const currentStep = getCurrentStep();
  
  // Don't show on landing page
  if (location.pathname === '/') return null;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-center gap-2"
    >
      {steps.map((step, index) => {
        const isCompleted = step.id < currentStep;
        const isCurrent = step.id === currentStep;
        const isUpcoming = step.id > currentStep;
        
        return (
          <div key={step.id} className="flex items-center">
            {/* Step Circle */}
            <motion.div
              initial={false}
              animate={{
                scale: isCurrent ? 1.1 : 1,
                backgroundColor: isCompleted 
                  ? 'hsl(var(--primary))' 
                  : isCurrent 
                    ? 'hsl(var(--primary))' 
                    : 'hsl(var(--muted))',
              }}
              className={cn(
                'flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors',
                isCompleted && 'text-primary-foreground',
                isCurrent && 'text-primary-foreground ring-2 ring-primary/30 ring-offset-2 ring-offset-background',
                isUpcoming && 'text-muted-foreground'
              )}
            >
              {isCompleted ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                >
                  <Check className="h-4 w-4" />
                </motion.div>
              ) : (
                step.id
              )}
            </motion.div>
            
            {/* Step Label */}
            <span
              className={cn(
                'ml-2 text-sm hidden sm:inline',
                isCurrent && 'font-medium text-foreground',
                isUpcoming && 'text-muted-foreground',
                isCompleted && 'text-muted-foreground'
              )}
            >
              {step.label}
            </span>
            
            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div className="mx-3 w-8 sm:w-12 h-0.5 bg-muted">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: isCompleted ? '100%' : '0%' }}
                  className="h-full bg-primary"
                  transition={{ duration: 0.3 }}
                />
              </div>
            )}
          </div>
        );
      })}
    </motion.div>
  );
}
