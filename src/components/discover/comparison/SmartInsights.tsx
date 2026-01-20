import { motion } from 'framer-motion';
import { Sparkles, TrendingUp, CloudSun, Users, Wallet } from 'lucide-react';
import { DestinationMatch } from '@/types/destination';
import { cn } from '@/lib/utils';

interface SmartInsightsProps {
  destinations: DestinationMatch[];
}

interface Insight {
  icon: React.ReactNode;
  text: string;
  type: 'positive' | 'neutral' | 'warning';
}

export function SmartInsights({ destinations }: SmartInsightsProps) {
  const generateInsights = (): Insight[] => {
    const insights: Insight[] = [];
    
    if (destinations.length < 2) return insights;
    
    // Find extremes
    const cheapest = destinations.reduce((a, b) => 
      a.estimatedTotalCost < b.estimatedTotalCost ? a : b
    );
    const mostExpensive = destinations.reduce((a, b) => 
      a.estimatedTotalCost > b.estimatedTotalCost ? a : b
    );
    const bestWeather = destinations.reduce((a, b) => 
      a.weatherScore > b.weatherScore ? a : b
    );
    const leastCrowded = destinations.reduce((a, b) => 
      a.crowdScore > b.crowdScore ? a : b
    );
    const bestValue = destinations.reduce((a, b) => 
      a.valueScore > b.valueScore ? a : b
    );

    // Cost comparison
    const costDiff = mostExpensive.estimatedTotalCost - cheapest.estimatedTotalCost;
    if (costDiff > 200) {
      insights.push({
        icon: <Wallet className="h-4 w-4" />,
        text: `${cheapest.name} saves you $${costDiff.toLocaleString()} compared to ${mostExpensive.name}`,
        type: 'positive'
      });
    }

    // Weather insight
    if (bestWeather.weatherScore >= 75) {
      insights.push({
        icon: <CloudSun className="h-4 w-4" />,
        text: `${bestWeather.name} offers the best weather for your travel dates`,
        type: 'positive'
      });
    }

    // Crowd insight
    if (leastCrowded.crowdScore >= 70) {
      insights.push({
        icon: <Users className="h-4 w-4" />,
        text: `${leastCrowded.name} will be less crowded during your trip`,
        type: 'positive'
      });
    }

    // Value insight
    insights.push({
      icon: <TrendingUp className="h-4 w-4" />,
      text: `${bestValue.name} offers the best overall value for your budget`,
      type: 'positive'
    });

    // Unique insights based on destination characteristics
    destinations.forEach(dest => {
      if (dest.bestFor.includes('food')) {
        insights.push({
          icon: <Sparkles className="h-4 w-4" />,
          text: `${dest.name} is perfect for food lovers`,
          type: 'neutral'
        });
      }
    });

    return insights.slice(0, 4);
  };

  const insights = generateInsights();

  if (insights.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="mt-6 p-4 bg-muted/50 rounded-xl border border-border"
    >
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-4 w-4 text-primary" />
        <h4 className="font-semibold text-sm">Smart Insights</h4>
      </div>
      <div className="space-y-2">
        {insights.map((insight, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 + i * 0.1 }}
            className={cn(
              'flex items-start gap-2 text-sm',
              insight.type === 'positive' && 'text-success',
              insight.type === 'warning' && 'text-warning',
              insight.type === 'neutral' && 'text-foreground'
            )}
          >
            {insight.icon}
            <span>{insight.text}</span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
