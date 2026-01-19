import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export function Logo({ size = 'md', showText = true }: LogoProps) {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-3xl',
  };

  return (
    <Link to="/" className="flex items-center gap-2 group">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-accent to-destructive rounded-full blur-sm opacity-60 group-hover:opacity-80 transition-opacity" />
        <div className="relative gradient-sunset rounded-full p-1.5">
          <Compass className={`${sizeClasses[size]} text-white`} />
        </div>
      </div>
      {showText && (
        <span className={`${textSizeClasses[size]} font-display font-bold text-gradient-sunset`}>
          ROAMEO
        </span>
      )}
    </Link>
  );
}
