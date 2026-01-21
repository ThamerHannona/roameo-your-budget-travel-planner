import { lazy, Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { TravelProvider } from "@/context/TravelContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Layout } from "@/components/Layout";
import { SearchingAnimation } from "@/components/loading";

// Lazy load pages for performance
const BudgetLanding = lazy(() => import("./pages/BudgetLanding"));
const Index = lazy(() => import("./pages/Index"));
const Results = lazy(() => import("./pages/Results"));
const Itinerary = lazy(() => import("./pages/Itinerary"));
const FinalItinerary = lazy(() => import("./pages/FinalItinerary"));
const Discover = lazy(() => import("./pages/Discover"));
const BudgetAllocation = lazy(() => import("./pages/BudgetAllocation"));
const DayByDayItinerary = lazy(() => import("./pages/DayByDayItinerary"));
const FinalBooking = lazy(() => import("./pages/FinalBooking"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange={false}
      storageKey="roameo-theme"
    >
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <TravelProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Suspense fallback={<SearchingAnimation />}>
                <Routes>
                  <Route path="/" element={<BudgetLanding />} />
                  <Route path="/wizard" element={<Index />} />
                  <Route path="/discover" element={<Discover />} />
                  <Route path="/compare" element={<Discover />} />
                  <Route path="/trip/:destinationId/budget" element={<BudgetAllocation />} />
                  <Route path="/results" element={<Results />} />
                  <Route path="/itinerary" element={<Itinerary />} />
                  <Route path="/trip/:destinationId/itinerary" element={<DayByDayItinerary />} />
                  <Route path="/trip/:destinationId/booking" element={<FinalBooking />} />
                  <Route path="/trip/:destinationId/share/:shareId" element={<DayByDayItinerary />} />
                  <Route path="/final" element={<FinalItinerary />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </TravelProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </ErrorBoundary>
);

export default App;
