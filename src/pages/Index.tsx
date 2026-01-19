import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { TripWizard } from '@/components/wizard';

const Index = () => {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-muted" />
      <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-primary/5 blur-3xl rounded-full" />
      <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-primary/5 blur-3xl rounded-full" />
      
      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="container mx-auto px-4 py-6 flex items-center justify-between">
          <Logo size="md" />
          <ThemeToggle />
        </header>

        {/* Hero Section */}
        <main className="container mx-auto px-4 py-6 md:py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-8"
          >
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Sparkles className="h-4 w-4" />
              Smart Trip Planner
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-foreground mb-4">
              Tell us your budget and dates
              <br />
              <span className="text-primary">We'll design the perfect trip</span>
            </h1>
            <p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto">
              Not just search results. An intelligent planning assistant that maximizes every dollar.
            </p>
          </motion.div>

          {/* Trip Wizard */}
          <TripWizard />

          {/* Features */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mt-12 max-w-3xl mx-auto"
          >
            {[
              { title: 'Smart Budget Allocation', desc: 'AI-optimized spending across flights, hotels & activities' },
              { title: 'Personalized Planning', desc: 'Tailored to your style and interests' },
              { title: 'Complete Itineraries', desc: 'Day-by-day plans with booking links' },
            ].map((feature, i) => (
              <div key={i} className="text-center p-4 bg-card/50 rounded-xl border border-border/50">
                <h3 className="font-display font-semibold text-foreground mb-1">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.desc}</p>
              </div>
            ))}
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default Index;
