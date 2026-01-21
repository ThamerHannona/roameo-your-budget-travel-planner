import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Navbar } from '@/components/navigation';

const pageVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

const pageTransition = {
  type: 'tween' as const,
  ease: 'easeInOut' as const,
  duration: 0.2,
};

interface LayoutProps {
  children?: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const isLandingPage = location.pathname === '/';
  
  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar - hidden on landing if desired */}
      {!isLandingPage && <Navbar />}
      
      {/* Main Content with Page Transitions */}
      <AnimatePresence mode="wait">
        <motion.main
          key={location.pathname}
          initial="initial"
          animate="animate"
          exit="exit"
          variants={pageVariants}
          transition={pageTransition}
          className="flex-1"
        >
          {children}
        </motion.main>
      </AnimatePresence>
    </div>
  );
}

// Wrapper for pages that need the layout without Outlet
export function PageWrapper({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={pageVariants}
        transition={pageTransition}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
