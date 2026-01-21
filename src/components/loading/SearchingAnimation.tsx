import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Plane, Search, MapPin, Hotel, Calendar, DollarSign } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface SearchingAnimationProps {
  destinationCount?: number;
  onComplete?: () => void;
}

const searchSteps = [
  { icon: Plane, text: 'Searching 1000+ flights...', duration: 1200 },
  { icon: Hotel, text: 'Finding the best hotels...', duration: 1000 },
  { icon: MapPin, text: 'Analyzing destinations...', duration: 800 },
  { icon: Calendar, text: 'Checking weather patterns...', duration: 600 },
  { icon: DollarSign, text: 'Calculating best value...', duration: 400 },
];

export function SearchingAnimation({ destinationCount = 35, onComplete }: SearchingAnimationProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  
  useEffect(() => {
    const totalDuration = searchSteps.reduce((acc, s) => acc + s.duration, 0);
    let elapsed = 0;
    
    const interval = setInterval(() => {
      elapsed += 50;
      const newProgress = Math.min(100, (elapsed / totalDuration) * 100);
      setProgress(newProgress);
      
      // Calculate current step
      let stepElapsed = 0;
      for (let i = 0; i < searchSteps.length; i++) {
        stepElapsed += searchSteps[i].duration;
        if (elapsed < stepElapsed) {
          setCurrentStep(i);
          break;
        }
      }
      
      if (elapsed >= totalDuration) {
        clearInterval(interval);
        onComplete?.();
      }
    }, 50);
    
    return () => clearInterval(interval);
  }, [onComplete]);
  
  const CurrentIcon = searchSteps[currentStep]?.icon || Search;
  
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      {/* Animated Globe */}
      <motion.div
        className="relative w-32 h-32 mb-8"
        animate={{ rotateY: 360 }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
      >
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 blur-xl" />
        <div className="absolute inset-2 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <CurrentIcon className="w-12 h-12 text-primary-foreground" />
          </motion.div>
        </div>
        
        {/* Orbiting dots */}
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute w-3 h-3 rounded-full bg-primary"
            animate={{
              rotate: 360,
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'linear',
              delay: i * 1,
            }}
            style={{
              top: '50%',
              left: '50%',
              transformOrigin: `${32 + i * 8}px 0`,
            }}
          />
        ))}
      </motion.div>
      
      {/* Current step text */}
      <motion.p
        key={currentStep}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-lg font-medium text-foreground mb-2"
      >
        {searchSteps[currentStep]?.text}
      </motion.p>
      
      {/* Progress bar */}
      <div className="w-64 mb-4">
        <Progress value={progress} className="h-2" />
      </div>
      
      {/* Destination count */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-sm text-muted-foreground"
      >
        Analyzing {destinationCount} destinations for you
      </motion.p>
    </div>
  );
}

// Progress bar for itinerary generation
export function ItineraryGenerationProgress({ progress }: { progress: number }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        className="w-16 h-16 rounded-full border-4 border-primary border-t-transparent mb-6"
      />
      
      <p className="text-lg font-medium mb-4">Creating your perfect itinerary...</p>
      
      <div className="w-64">
        <Progress value={progress} className="h-3" />
      </div>
      
      <p className="text-sm text-muted-foreground mt-2">{Math.round(progress)}% complete</p>
    </div>
  );
}
