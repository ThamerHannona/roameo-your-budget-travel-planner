import { Link } from 'react-router-dom';
import roameoIcon from '@/assets/roameo-icon.png';
import roameoWordmark from '@/assets/roameo-wordmark.png';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export function Logo({ size = 'md', showText = true }: LogoProps) {
  const iconSizeClasses = {
    sm: 'h-7 w-7',
    md: 'h-9 w-9',
    lg: 'h-14 w-14',
  };

  const wordmarkHeightClasses = {
    sm: 'h-6',
    md: 'h-[1.875rem]',
    lg: 'h-[3.125rem]',
  };

  return (
    <Link to="/" className="flex items-center gap-0.5 group">
      <img 
        src={roameoIcon} 
        alt="" 
        className={`${iconSizeClasses[size]} object-contain transition-transform group-hover:scale-105`}
      />
      {showText && (
        <div 
          className={`${wordmarkHeightClasses[size]} relative`}
          style={{
            background: 'linear-gradient(135deg, #a78bfa 0%, #e879f9 50%, #38bdf8 100%)',
            WebkitMaskImage: `url(${roameoWordmark})`,
            WebkitMaskSize: 'contain',
            WebkitMaskRepeat: 'no-repeat',
            WebkitMaskPosition: 'center',
            maskImage: `url(${roameoWordmark})`,
            maskSize: 'contain',
            maskRepeat: 'no-repeat',
            maskPosition: 'center',
            aspectRatio: '4.5 / 1',
          }}
        />
      )}
    </Link>
  );
}
