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
    sm: 'h-7',
    md: 'h-9',
    lg: 'h-[3.75rem]',
  };

  return (
    <Link to="/" className="flex items-center group">
      <img 
        src={roameoIcon} 
        alt="" 
        className={`${iconSizeClasses[size]} object-contain transition-transform group-hover:scale-105 -mr-1`}
      />
      {showText && (
        <div 
          className={`${wordmarkHeightClasses[size]} relative -ml-1`}
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
