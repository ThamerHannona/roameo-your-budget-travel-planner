import { Link } from 'react-router-dom';
import logoImage from '@/assets/logo.jpeg';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export function Logo({ size = 'md', showText = false }: LogoProps) {
  const sizeClasses = {
    sm: 'h-8',
    md: 'h-10',
    lg: 'h-14',
  };

  return (
    <Link to="/" className="flex items-center gap-2 group">
      <img 
        src={logoImage} 
        alt="ROAMEO" 
        className={`${sizeClasses[size]} w-auto object-contain`}
      />
    </Link>
  );
}
