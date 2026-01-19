import { Link } from 'react-router-dom';
import logoIcon from '@/assets/logo-icon.jpeg';

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

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-3xl',
  };

  return (
    <Link to="/" className="flex items-center gap-2.5 group">
      <img 
        src={logoIcon} 
        alt="ROAMEO" 
        className={`${iconSizeClasses[size]} rounded-full object-cover transition-transform group-hover:scale-105`}
      />
      {showText && (
        <span 
          className={`${textSizeClasses[size]} font-display font-bold tracking-wider`}
          style={{
            background: 'linear-gradient(135deg, #a78bfa 0%, #e879f9 50%, #38bdf8 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          ROAMEO
        </span>
      )}
    </Link>
  );
}
