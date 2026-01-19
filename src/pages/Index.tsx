import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Calendar, DollarSign, Users, ArrowRight, Sparkles } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTravel } from '@/context/TravelContext';
import { TravelSearch } from '@/types/travel';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const Index = () => {
  const navigate = useNavigate();
  const { setSearch } = useTravel();
  
  const [formData, setFormData] = useState<TravelSearch>({
    origin: '',
    destination: '',
    departureDate: '',
    returnDate: '',
    budget: 2000,
    travelers: 1,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(formData);
    navigate('/results');
  };

  const updateField = (field: keyof TravelSearch, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const isFormValid = formData.origin && formData.destination && 
    formData.departureDate && formData.returnDate && formData.budget > 0;

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-muted" />
      <div className="absolute top-0 right-0 w-1/2 h-1/2 gradient-sunset opacity-10 blur-3xl" />
      <div className="absolute bottom-0 left-0 w-1/3 h-1/3 gradient-ocean opacity-10 blur-3xl" />
      
      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="container mx-auto px-4 py-6">
          <Logo size="md" />
        </header>

        {/* Hero Section */}
        <main className="container mx-auto px-4 py-8 lg:py-16">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="max-w-4xl mx-auto"
          >
            {/* Hero Text */}
            <motion.div variants={itemVariants} className="text-center mb-12">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
                <Sparkles className="h-4 w-4" />
                Budget-first travel planning
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-foreground mb-4">
                Travel smarter,{' '}
                <span className="text-gradient-sunset">not harder</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Set your budget first, then discover flights and hotels that fit. 
                Compare side-by-side and build your perfect trip.
              </p>
            </motion.div>

            {/* Search Form */}
            <motion.form
              variants={itemVariants}
              onSubmit={handleSubmit}
              className="bg-card rounded-2xl shadow-xl border border-border p-6 md:p-8"
            >
              {/* Budget Input - Prominent */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-3">
                  <div className="gradient-sunset p-2 rounded-lg">
                    <DollarSign className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <Label className="text-lg font-display font-semibold text-foreground">
                    What's your total budget?
                  </Label>
                </div>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-primary">$</span>
                  <Input
                    type="number"
                    value={formData.budget}
                    onChange={(e) => updateField('budget', parseInt(e.target.value) || 0)}
                    className="text-3xl font-display font-bold h-16 pl-10 pr-4 text-foreground"
                    placeholder="2000"
                    min={100}
                  />
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  We'll find flights and hotels that fit within your budget
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-6">
                {/* Origin */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    <Label className="font-medium text-foreground">From</Label>
                  </div>
                  <Input
                    value={formData.origin}
                    onChange={(e) => updateField('origin', e.target.value)}
                    placeholder="Los Angeles, CA"
                    className="h-12"
                  />
                </div>

                {/* Destination */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="h-4 w-4 text-accent" />
                    <Label className="font-medium text-foreground">To</Label>
                  </div>
                  <Input
                    value={formData.destination}
                    onChange={(e) => updateField('destination', e.target.value)}
                    placeholder="New York, NY"
                    className="h-12"
                  />
                </div>

                {/* Departure Date */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    <Label className="font-medium text-foreground">Departure</Label>
                  </div>
                  <Input
                    type="date"
                    value={formData.departureDate}
                    onChange={(e) => updateField('departureDate', e.target.value)}
                    className="h-12"
                  />
                </div>

                {/* Return Date */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4 text-accent" />
                    <Label className="font-medium text-foreground">Return</Label>
                  </div>
                  <Input
                    type="date"
                    value={formData.returnDate}
                    onChange={(e) => updateField('returnDate', e.target.value)}
                    className="h-12"
                  />
                </div>
              </div>

              {/* Travelers */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-primary" />
                  <Label className="font-medium text-foreground">Travelers</Label>
                </div>
                <Input
                  type="number"
                  value={formData.travelers}
                  onChange={(e) => updateField('travelers', parseInt(e.target.value) || 1)}
                  className="h-12 max-w-32"
                  min={1}
                  max={10}
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                size="lg"
                disabled={!isFormValid}
                className="w-full h-14 text-lg font-display font-semibold gradient-sunset hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                Find my perfect trip
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </motion.form>

            {/* Features */}
            <motion.div
              variants={itemVariants}
              className="grid md:grid-cols-3 gap-6 mt-12"
            >
              {[
                { title: 'Budget First', desc: 'See only options within your budget' },
                { title: 'Compare Easy', desc: 'Side-by-side flight & hotel comparison' },
                { title: 'Book Direct', desc: 'Links to airlines & hotels for best rates' },
              ].map((feature, i) => (
                <div key={i} className="text-center p-4">
                  <h3 className="font-display font-semibold text-foreground mb-1">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.desc}</p>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default Index;
