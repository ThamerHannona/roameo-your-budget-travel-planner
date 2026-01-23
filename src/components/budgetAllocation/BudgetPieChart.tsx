import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import type { BudgetConstraints, CategoryKey } from '@/types/budgetConstraints';
import { CATEGORY_LABELS, CATEGORY_COLORS, CATEGORY_ICONS } from '@/types/budgetConstraints';

interface BudgetPieChartProps {
  constraints: BudgetConstraints;
  totalBudget: number;
}

interface ChartData {
  name: string;
  value: number;
  percentage: number;
  color: string;
  icon: string;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-popover border border-border rounded-lg shadow-lg p-3"
      >
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg">{data.icon}</span>
          <span className="font-semibold text-foreground">{data.name}</span>
        </div>
        <div className="text-2xl font-display font-bold text-foreground">
          ${data.value.toLocaleString()}
        </div>
        <div className="text-sm text-muted-foreground">
          {data.percentage}% of budget
        </div>
      </motion.div>
    );
  }
  return null;
};

export function BudgetPieChart({ constraints, totalBudget }: BudgetPieChartProps) {
  const chartData: ChartData[] = useMemo(() => {
    const categories: CategoryKey[] = ['flights', 'hotels', 'activities', 'food', 'transport'];
    
    return categories.map((key) => ({
      name: CATEGORY_LABELS[key],
      value: constraints[key].current,
      percentage: Math.round((constraints[key].current / totalBudget) * 100),
      color: CATEGORY_COLORS[key],
      icon: CATEGORY_ICONS[key],
    }));
  }, [constraints, totalBudget]);

  const total = useMemo(
    () => chartData.reduce((sum, item) => sum + item.value, 0),
    [chartData]
  );

  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={70}
            outerRadius={110}
            paddingAngle={2}
            dataKey="value"
            animationBegin={0}
            animationDuration={500}
            animationEasing="ease-out"
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color}
                stroke="transparent"
                style={{ outline: 'none' }}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      {/* Center content */}
      <motion.div
        key={total}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
      >
        <span className="text-sm text-muted-foreground">Total</span>
        <span className="text-2xl font-display font-bold text-foreground">
          ${total.toLocaleString()}
        </span>
        <span className="text-xs text-muted-foreground">
          {total === totalBudget ? '✓ Balanced' : total > totalBudget ? 'Over budget' : 'Under budget'}
        </span>
      </motion.div>

      {/* Legend */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        {chartData.map((item) => (
          <motion.div
            key={item.name}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 text-sm"
          >
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-muted-foreground truncate">{item.name}</span>
            <span className="font-medium text-foreground ml-auto">{item.percentage}%</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
