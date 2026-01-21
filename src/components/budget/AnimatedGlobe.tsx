import { motion } from 'framer-motion';
import roameoIcon from '@/assets/roameo-icon.png';

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

  const imgSizeMap = {
    sm: 48,
    md: 80,
    lg: 128,
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
      
      {/* ROAMEO Icon */}
      <motion.img
        src={roameoIcon}
        alt="ROAMEO"
        width={imgSizeMap[size]}
        height={imgSizeMap[size]}
        className="relative z-10 drop-shadow-lg"
        animate={{
          rotate: -360, // Counter-rotate to keep icon upright
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'linear',
        }}
      />

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
