// Types for date flexibility pricing

export interface DatePrice {
  date: Date;
  totalPrice: number;
  flightPrice: number;
  hotelPrice: number;
  isAvailable: boolean;
  isWeekend: boolean;
  isHoliday: boolean;
  holidayName?: string;
}

export interface DateRange {
  start: Date;
  end: Date;
}

export interface PriceTrend {
  date: Date;
  price: number;
}

export interface SavingsHighlight {
  type: 'best-deal' | 'avoid' | 'average' | 'tip';
  icon: string;
  title: string;
  description: string;
  dateRange?: DateRange;
  price?: number;
  savings?: number;
}

export type PriceCategory = 'cheaper' | 'similar' | 'expensive' | 'unavailable';

export interface QuickSelectOption {
  id: string;
  label: string;
  icon: string;
  dateRange: DateRange;
  price: number;
}
