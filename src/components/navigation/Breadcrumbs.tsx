import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

const routeBreadcrumbs: Record<string, BreadcrumbItem[]> = {
  '/': [{ label: 'Home' }],
  '/discover': [
    { label: 'Home', href: '/' },
    { label: 'Discover Destinations' },
  ],
  '/compare': [
    { label: 'Home', href: '/' },
    { label: 'Discover', href: '/discover' },
    { label: 'Compare' },
  ],
  '/trip/:destinationId/budget': [
    { label: 'Home', href: '/' },
    { label: 'Discover', href: '/discover' },
    { label: 'Budget Allocation' },
  ],
  '/trip/:destinationId/itinerary': [
    { label: 'Home', href: '/' },
    { label: 'Discover', href: '/discover' },
    { label: 'Budget', href: '/trip/:destinationId/budget' },
    { label: 'Itinerary' },
  ],
};

export function Breadcrumbs() {
  const location = useLocation();
  
  // Match route pattern
  const getPattern = (path: string): string => {
    if (path.includes('/trip/') && path.includes('/budget')) {
      return '/trip/:destinationId/budget';
    }
    if (path.includes('/trip/') && path.includes('/itinerary')) {
      return '/trip/:destinationId/itinerary';
    }
    return path;
  };
  
  const pattern = getPattern(location.pathname);
  const breadcrumbs = routeBreadcrumbs[pattern] || [{ label: 'Home', href: '/' }];
  
  // Don't show breadcrumbs on home page
  if (location.pathname === '/') return null;
  
  return (
    <motion.nav
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-1 text-sm text-muted-foreground"
      aria-label="Breadcrumb"
    >
      {breadcrumbs.map((item, index) => {
        const isLast = index === breadcrumbs.length - 1;
        
        // Replace :destinationId with actual ID if present
        let href = item.href;
        if (href?.includes(':destinationId')) {
          const match = location.pathname.match(/\/trip\/([^/]+)/);
          if (match) {
            href = href.replace(':destinationId', match[1]);
          }
        }
        
        return (
          <span key={index} className="flex items-center gap-1">
            {index === 0 && <Home className="h-3.5 w-3.5" />}
            {href && !isLast ? (
              <Link
                to={href}
                className="hover:text-foreground transition-colors hover-scale"
              >
                {item.label}
              </Link>
            ) : (
              <span className={cn(isLast && 'text-foreground font-medium')}>
                {item.label}
              </span>
            )}
            {!isLast && <ChevronRight className="h-3.5 w-3.5" />}
          </span>
        );
      })}
    </motion.nav>
  );
}
