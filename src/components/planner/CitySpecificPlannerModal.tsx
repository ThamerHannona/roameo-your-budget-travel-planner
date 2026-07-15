import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, MapPin, Calendar as CalendarIcon, Users, ArrowRight, Building2, Route } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CityAutocomplete } from '@/components/CityAutocomplete';
import { DateRangePicker } from '@/components/DateRangePicker';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useTripSearchStore } from '@/stores/tripSearchStore';
import { useMultiCityStore, type CityLeg } from '@/stores/multiCityStore';
import { toast } from 'sonner';

interface CitySpecificPlannerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const uid = () => Math.random().toString(36).slice(2, 9);

export function CitySpecificPlannerModal({ open, onOpenChange }: CitySpecificPlannerModalProps) {
  const navigate = useNavigate();
  const tripStore = useTripSearchStore();
  const multi = useMultiCityStore();

  const [tab, setTab] = useState<'specific' | 'multi'>('specific');

  // Specific city state
  const [origin, setOrigin] = useState(tripStore.departureCity);
  const [destination, setDestination] = useState('');
  const [start, setStart] = useState<Date | undefined>(tripStore.dates.start ?? undefined);
  const [end, setEnd] = useState<Date | undefined>(tripStore.dates.end ?? undefined);
  const [travelers, setTravelers] = useState(tripStore.travelers);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Multi-city state
  const [mcOrigin, setMcOrigin] = useState(tripStore.departureCity);
  const [mcTravelers, setMcTravelers] = useState(tripStore.travelers);
  const [mcStart, setMcStart] = useState<Date | undefined>(tripStore.dates.start ?? undefined);
  const [legs, setLegs] = useState<CityLeg[]>(
    multi.legs.length > 0
      ? multi.legs
      : [
          { id: uid(), city: '', nights: 3 },
          { id: uid(), city: '', nights: 3 },
        ]
  );

  const totalNights = legs.reduce((sum, l) => sum + (Number(l.nights) || 0), 0);

  const slugify = (s: string) =>
    s.toLowerCase().replace(/,.*$/, '').trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const submitSpecific = () => {
    const e: Record<string, string> = {};
    if (!origin.trim()) e.origin = 'Enter your departure city';
    if (!destination.trim()) e.destination = 'Enter the city you want to visit';
    if (!start || !end) e.dates = 'Choose your travel dates';
    setErrors(e);
    if (Object.keys(e).length) return;

    const days = Math.max(
      1,
      Math.round(((end!.getTime() - start!.getTime()) / (1000 * 60 * 60 * 24))) + 1
    );

    tripStore.setDepartureCity(origin);
    tripStore.setDates(start!, end!);
    tripStore.setTravelers(travelers);
    tripStore.setDays(days);

    multi.setPlan({ mode: 'specific', origin, legs: [], startDate: start!.toISOString(), travelers });

    const slug = slugify(destination);
    onOpenChange(false);
    navigate(`/trip/${slug}/budget`);
  };

  const submitMulti = () => {
    if (!mcOrigin.trim()) {
      toast.error('Enter your departure city');
      return;
    }
    const filled = legs.filter((l) => l.city.trim() && l.nights > 0);
    if (filled.length < 2) {
      toast.error('Add at least 2 cities');
      return;
    }
    if (!mcStart) {
      toast.error('Pick a start date');
      return;
    }

    tripStore.setDepartureCity(mcOrigin);
    tripStore.setTravelers(mcTravelers);
    const end = new Date(mcStart);
    end.setDate(end.getDate() + totalNights);
    tripStore.setDates(mcStart, end);

    multi.setPlan({
      mode: 'multi',
      origin: mcOrigin,
      legs: filled,
      startDate: mcStart.toISOString(),
      travelers: mcTravelers,
    });

    const firstSlug = slugify(filled[0].city);
    onOpenChange(false);
    toast.success(`Multi-city trip: ${filled.map((l) => l.city.split(',')[0]).join(' → ')}`);
    navigate(`/trip/${firstSlug}/budget`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-display">Plan a specific trip</DialogTitle>
          <DialogDescription>
            Already know where you want to go? Plan one city or hop between several.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(v as 'specific' | 'multi')} className="mt-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="specific" className="gap-2">
              <Building2 className="h-4 w-4" /> Specific City
            </TabsTrigger>
            <TabsTrigger value="multi" className="gap-2">
              <Route className="h-4 w-4" /> Multi-City
            </TabsTrigger>
          </TabsList>

          {/* SPECIFIC CITY */}
          <TabsContent value="specific" className="space-y-5 pt-4">
            <div className="grid md:grid-cols-2 gap-4">
              <CityAutocomplete
                value={origin}
                onChange={setOrigin}
                label="From"
                placeholder="Los Angeles, CA"
                error={errors.origin}
              />
              <CityAutocomplete
                value={destination}
                onChange={setDestination}
                label="To"
                placeholder="Tokyo, Japan"
                error={errors.destination}
              />
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <CalendarIcon className="h-4 w-4 text-primary" />
                <Label className="text-sm font-medium">Travel dates</Label>
              </div>
              <DateRangePicker
                startDate={start}
                endDate={end}
                onStartDateChange={setStart}
                onEndDateChange={setEnd}
                error={errors.dates}
              />
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-primary" />
                <Label className="text-sm font-medium">Travelers</Label>
              </div>
              <Input
                type="number"
                min={1}
                max={10}
                value={travelers}
                onChange={(e) => setTravelers(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
                className="w-28 h-11"
              />
            </div>

            <Button
              onClick={submitSpecific}
              size="lg"
              className="w-full h-14 text-base font-semibold gap-2 text-white"
              style={{
                background: 'linear-gradient(135deg, #a78bfa 0%, #e879f9 50%, #38bdf8 100%)',
              }}
            >
              Plan this trip
              <ArrowRight className="h-5 w-5" />
            </Button>
          </TabsContent>

          {/* MULTI-CITY */}
          <TabsContent value="multi" className="space-y-5 pt-4">
            <div className="grid md:grid-cols-2 gap-4">
              <CityAutocomplete
                value={mcOrigin}
                onChange={setMcOrigin}
                label="Starting from"
                placeholder="Los Angeles, CA"
              />
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <CalendarIcon className="h-4 w-4 text-primary" />
                  <Label className="text-sm font-medium">Trip start date</Label>
                </div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full h-12 justify-start text-left font-normal',
                        !mcStart && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {mcStart ? format(mcStart, 'MMM d, yyyy') : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={mcStart}
                      onSelect={setMcStart}
                      disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  <Label className="text-sm font-medium">Cities & nights</Label>
                </div>
                <span className="text-xs text-muted-foreground">
                  {totalNights} nights total
                </span>
              </div>

              <div className="space-y-3">
                {legs.map((leg, idx) => (
                  <div key={leg.id} className="flex gap-2 items-start">
                    <div className="flex h-12 w-8 items-center justify-center rounded-md bg-muted text-sm font-semibold text-muted-foreground">
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <CityAutocomplete
                        value={leg.city}
                        onChange={(v) =>
                          setLegs((prev) => prev.map((l) => (l.id === leg.id ? { ...l, city: v } : l)))
                        }
                        placeholder={`City ${idx + 1}`}
                      />
                    </div>
                    <div className="w-24">
                      <Input
                        type="number"
                        min={1}
                        max={30}
                        value={leg.nights}
                        onChange={(e) =>
                          setLegs((prev) =>
                            prev.map((l) =>
                              l.id === leg.id
                                ? { ...l, nights: Math.max(1, Math.min(30, parseInt(e.target.value) || 1)) }
                                : l
                            )
                          )
                        }
                        className="h-12 text-center"
                      />
                      <p className="text-[10px] text-muted-foreground text-center mt-1">nights</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-12 w-10 text-muted-foreground hover:text-destructive"
                      onClick={() => setLegs((prev) => prev.filter((l) => l.id !== leg.id))}
                      disabled={legs.length <= 2}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <Button
                variant="outline"
                size="sm"
                className="mt-3 gap-2"
                onClick={() => setLegs((prev) => [...prev, { id: uid(), city: '', nights: 2 }])}
                disabled={legs.length >= 8}
              >
                <Plus className="h-4 w-4" /> Add city
              </Button>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-primary" />
                <Label className="text-sm font-medium">Travelers</Label>
              </div>
              <Input
                type="number"
                min={1}
                max={10}
                value={mcTravelers}
                onChange={(e) => setMcTravelers(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
                className="w-28 h-11"
              />
            </div>

            <Button
              onClick={submitMulti}
              size="lg"
              className="w-full h-14 text-base font-semibold gap-2 text-white"
              style={{
                background: 'linear-gradient(135deg, #a78bfa 0%, #e879f9 50%, #38bdf8 100%)',
              }}
            >
              Plan multi-city trip
              <ArrowRight className="h-5 w-5" />
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
