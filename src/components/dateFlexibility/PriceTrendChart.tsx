import { useMemo } from 'react';
import { format } from 'date-fns';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceDot,
} from 'recharts';
import type { PriceTrend, DateRange } from '@/types/dateFlexibility';

interface PriceTrendChartProps {
  trends: PriceTrend[];
  selectedRange: DateRange;
  currentPrice: number;
  bestDealDate?: Date;
}

export function PriceTrendChart({
  trends,
  selectedRange,
  currentPrice,
  bestDealDate,
}: PriceTrendChartProps) {
  const chartData = useMemo(() => {
    return trends.map(t => ({
      date: format(t.date, 'MMM d'),
      fullDate: t.date,
      price: t.price,
    }));
  }, [trends]);

  const minPrice = Math.min(...trends.map(t => t.price));
  const maxPrice = Math.max(...trends.map(t => t.price));
  const padding = (maxPrice - minPrice) * 0.1;

  // Find selected date index
  const selectedIndex = chartData.findIndex(
    d => format(d.fullDate, 'yyyy-MM-dd') === format(selectedRange.start, 'yyyy-MM-dd')
  );

  // Find best deal index
  const bestDealIndex = bestDealDate 
    ? chartData.findIndex(d => format(d.fullDate, 'yyyy-MM-dd') === format(bestDealDate, 'yyyy-MM-dd'))
    : -1;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium text-foreground">{label}</p>
          <p className="text-lg font-bold text-primary">
            ${payload[0].value.toLocaleString()}
          </p>
          {payload[0].value < currentPrice && (
            <p className="text-xs text-success">
              Save ${(currentPrice - payload[0].value).toLocaleString()}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-[200px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
          </defs>
          
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 10 }}
            tickLine={false}
            axisLine={{ className: 'stroke-border' }}
            interval="preserveStartEnd"
            className="text-muted-foreground"
          />
          
          <YAxis 
            domain={[minPrice - padding, maxPrice + padding]}
            tick={{ fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `$${value >= 1000 ? `${(value/1000).toFixed(1)}k` : value}`}
            className="text-muted-foreground"
            width={50}
          />
          
          <Tooltip content={<CustomTooltip />} />

          {/* Current price reference line */}
          <ReferenceLine 
            y={currentPrice} 
            stroke="hsl(var(--muted-foreground))" 
            strokeDasharray="5 5"
            label={{ 
              value: 'Current', 
              position: 'right',
              className: 'text-xs fill-muted-foreground'
            }}
          />

          {/* Selected date vertical line */}
          {selectedIndex >= 0 && (
            <ReferenceLine 
              x={chartData[selectedIndex]?.date} 
              stroke="hsl(var(--primary))" 
              strokeWidth={2}
              label={{ 
                value: 'Selected', 
                position: 'top',
                className: 'text-xs fill-primary font-medium'
              }}
            />
          )}

          {/* Price line */}
          <Line
            type="monotone"
            dataKey="price"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 6, className: 'fill-primary' }}
            fill="url(#priceGradient)"
          />

          {/* Best deal marker */}
          {bestDealIndex >= 0 && chartData[bestDealIndex] && (
            <ReferenceDot
              x={chartData[bestDealIndex].date}
              y={chartData[bestDealIndex].price}
              r={8}
              fill="hsl(var(--success))"
              stroke="white"
              strokeWidth={2}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
      
      {/* Best deal legend */}
      {bestDealIndex >= 0 && (
        <div className="flex justify-center mt-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="w-3 h-3 rounded-full bg-success" />
            <span>Best Deal</span>
          </div>
        </div>
      )}
    </div>
  );
}
