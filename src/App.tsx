import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { TravelProvider } from "@/context/TravelContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ThemeProvider } from "@/components/ThemeProvider";
import BudgetLanding from "./pages/BudgetLanding";
import Index from "./pages/Index";
import Results from "./pages/Results";
import Itinerary from "./pages/Itinerary";
import FinalItinerary from "./pages/FinalItinerary";
import Discover from "./pages/Discover";
import BudgetAllocation from "./pages/BudgetAllocation";
import DayByDayItinerary from "./pages/DayByDayItinerary";
import NotFound from "./pages/NotFound";

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
              <Routes>
                <Route path="/" element={<BudgetLanding />} />
                <Route path="/wizard" element={<Index />} />
                <Route path="/discover" element={<Discover />} />
                <Route path="/trip/:destinationId/budget" element={<BudgetAllocation />} />
                <Route path="/results" element={<Results />} />
                <Route path="/itinerary" element={<Itinerary />} />
                <Route path="/trip/:destinationId/itinerary" element={<DayByDayItinerary />} />
                <Route path="/final" element={<FinalItinerary />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TravelProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </ErrorBoundary>
);

export default App;
