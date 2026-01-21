import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Menu, X, ArrowLeft, HelpCircle, FolderOpen } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Breadcrumbs } from './Breadcrumbs';
import { ProgressStepper } from './ProgressStepper';
import { cn } from '@/lib/utils';
import logoIcon from '@/assets/logo-icon.jpeg';

export function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const isLandingPage = location.pathname === '/';
  const canGoBack = !isLandingPage;
  
  // Mock saved trips for dropdown
  const savedTrips = [
    { id: '1', name: 'Lisbon Adventure', date: 'Mar 15-20' },
    { id: '2', name: 'Tokyo Exploration', date: 'Apr 5-12' },
  ];
  
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60',
        isLandingPage && 'border-transparent bg-transparent'
      )}
    >
      <div className="container flex h-14 items-center justify-between">
        {/* Left Section: Back Button + Logo */}
        <div className="flex items-center gap-3">
          {canGoBack && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="h-8 w-8"
              aria-label="Go back"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          
          <Link to="/" className="flex items-center gap-2 hover-scale">
            <img 
              src={logoIcon} 
              alt="Roamio" 
              className="h-8 w-8 rounded-lg"
            />
            <span className="font-bold text-xl tracking-tight hidden sm:inline">
              ROAMIO
            </span>
          </Link>
        </div>
        
        {/* Center: Progress Stepper (desktop only) */}
        <div className="hidden md:flex flex-1 justify-center">
          <ProgressStepper />
        </div>
        
        {/* Right Section: Actions */}
        <div className="flex items-center gap-2">
          {/* My Trips Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="hidden sm:flex gap-2">
                <FolderOpen className="h-4 w-4" />
                My Trips
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {savedTrips.length > 0 ? (
                savedTrips.map(trip => (
                  <DropdownMenuItem key={trip.id} className="flex flex-col items-start">
                    <span className="font-medium">{trip.name}</span>
                    <span className="text-xs text-muted-foreground">{trip.date}</span>
                  </DropdownMenuItem>
                ))
              ) : (
                <DropdownMenuItem disabled>No saved trips</DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Help */}
          <Button variant="ghost" size="icon" className="h-8 w-8 hidden sm:flex">
            <HelpCircle className="h-4 w-4" />
          </Button>
          
          {/* Theme Toggle */}
          <ThemeToggle />
          
          {/* Mobile Menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 md:hidden">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px]">
              <div className="flex flex-col gap-4 mt-8">
                <div className="font-medium text-lg">Navigation</div>
                <Link
                  to="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-accent"
                >
                  Budget Setup
                </Link>
                <Link
                  to="/discover"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-accent"
                >
                  Discover Destinations
                </Link>
                
                <div className="border-t pt-4 mt-2">
                  <div className="font-medium text-lg mb-2">My Trips</div>
                  {savedTrips.map(trip => (
                    <div key={trip.id} className="p-2 rounded-lg hover:bg-accent cursor-pointer">
                      <div className="font-medium">{trip.name}</div>
                      <div className="text-xs text-muted-foreground">{trip.date}</div>
                    </div>
                  ))}
                </div>
                
                <div className="border-t pt-4 mt-2">
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <HelpCircle className="h-4 w-4" />
                    Help & Support
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
      
      {/* Breadcrumbs Row (non-landing pages) */}
      {!isLandingPage && (
        <div className="container pb-2">
          <Breadcrumbs />
        </div>
      )}
    </motion.header>
  );
}
