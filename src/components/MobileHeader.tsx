import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Plane, MapPin, Calendar, CheckCircle } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

interface MobileHeaderProps {
  rightContent?: React.ReactNode;
}

const navItems = [
  { path: '/', label: 'Search', icon: MapPin },
  { path: '/results', label: 'Results', icon: Plane },
  { path: '/itinerary', label: 'Itinerary', icon: Calendar },
  { path: '/final', label: 'Final', icon: CheckCircle },
];

export function MobileHeader({ rightContent }: MobileHeaderProps) {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-3">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              aria-label="Open navigation menu"
              aria-expanded={open}
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[280px] p-0">
            <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
            <div className="flex flex-col h-full">
              <div className="p-4 border-b border-border">
                <Logo size="sm" />
              </div>
              <nav 
                className="flex-1 p-4 space-y-1"
                role="navigation"
                aria-label="Main navigation"
              >
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setOpen(false)}
                      className={cn(
                        'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                        'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'text-foreground hover:bg-muted'
                      )}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      <Icon className="h-5 w-5" aria-hidden="true" />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          </SheetContent>
        </Sheet>
        <Logo size="sm" />
      </div>
      
      {rightContent && (
        <div className="flex items-center gap-2">
          {rightContent}
        </div>
      )}
    </div>
  );
}
