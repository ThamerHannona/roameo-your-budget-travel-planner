import { motion } from 'framer-motion';
import { Globe } from 'lucide-react';

interface AnimatedGlobeProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function AnimatedGlobe({ size = 'md', className }: AnimatedGlobeProps) {
  const sizeMap = {
    sm: 'w-12 h-12',
    md: 'w-20 h-20',
    lg: 'w-32 h-32',
  };

  const iconSizeMap = {
    sm: 24,
    md: 40,
    lg: 64,
  };

  return (
    <motion.div
      className={`relative flex items-center justify-center ${sizeMap[size]} ${className}`}
      animate={{ rotate: 360 }}
      transition={{
        duration: 20,
        repeat: Infinity,
        ease: 'linear',
      }}
    >
      {/* Outer glow ring */}
      <motion.div
        className="absolute inset-0 rounded-full bg-primary/20"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.5, 0.2, 0.5],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      
      {/* Inner container */}
      <div className="relative z-10 rounded-full bg-gradient-to-br from-primary to-primary/60 p-3 shadow-lg">
        <Globe 
          size={iconSizeMap[size]} 
          className="text-primary-foreground"
          strokeWidth={1.5}
        />
      </div>

      {/* Orbiting dot */}
      <motion.div
        className="absolute w-2 h-2 rounded-full bg-warning"
        style={{ top: '10%', left: '50%' }}
        animate={{
          rotate: 360,
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
    </motion.div>
  );
}
