'use client';

import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

interface RatingDistributionChartProps {
  ratingDistribution: Record<string, number>;
  scale: { min: number; max: number };
  className?: string;
}

export function RatingDistributionChart({
  ratingDistribution,
  scale,
  className = ""
}: RatingDistributionChartProps) {
  // Prepare data for the chart
  const chartData = [];
  for (let i = scale.min; i <= scale.max; i++) {
    chartData.push({
      rating: i.toString(),
      count: ratingDistribution[i] || 0,
      percentage: ratingDistribution[i] || 0
    });
  }

  // Calculate total for percentage calculation
  const total = chartData.reduce((sum, item) => sum + item.count, 0);

  // Update percentages
  chartData.forEach(item => {
    item.percentage = total > 0 ? (item.count / total) * 100 : 0;
  });

  // Color scheme for ratings (1=red, 5=green)
  const getBarColor = (rating: string) => {
    const ratingNum = parseInt(rating);
    const colors = {
      1: '#ef4444', // red-500
      2: '#f97316', // orange-500
      3: '#eab308', // yellow-500
      4: '#22c55e', // green-500
      5: '#10b981'  // emerald-500
    };
    return colors[ratingNum as keyof typeof colors] || '#6b7280';
  };

  const chartConfig = {
    count: {
      label: 'Responses'
    }
  };

  if (total === 0) {
    return (
      <div className={`flex items-center justify-center h-48 text-gray-500 ${className}`}>
        No rating responses available
      </div>
    );
  }

  return (
    <div className={`${className} bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-lg p-4 border border-slate-200/50`}>
      {/* Chart with enhanced styling */}
      <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-100 mb-4">
        <ChartContainer config={chartConfig} className="h-56">
          <BarChart data={chartData} margin={{ top: 10, right: 15, left: 5, bottom: 5 }}>
            <XAxis
              dataKey="rating"
              axisLine={false}
              tickLine={false}
              fontSize={12}
              tick={{ fill: '#64748b' }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              fontSize={11}
              tick={{ fill: '#64748b' }}
              width={30}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, name) => [
                    `${value} responses (${chartData.find(item => item.count === value)?.percentage.toFixed(1)}%)`,
                    'Count'
                  ]}
                  labelFormatter={(label) => `${label} star${parseInt(label) !== 1 ? 's' : ''}`}
                />
              }
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={60}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.rating)} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </div>

      {/* Enhanced summary grid */}
      <div className="grid grid-cols-5 gap-3">
        {chartData.map((item) => {
          const isHighest = item.count === Math.max(...chartData.map(d => d.count));
          return (
            <div
              key={item.rating}
              className={`text-center p-3 rounded-lg border transition-all ${
                isHighest
                  ? 'bg-white border-blue-200 shadow-sm ring-1 ring-blue-100'
                  : 'bg-slate-50/50 border-slate-200/50'
              }`}
            >
              <div className="flex items-center justify-center mb-1">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: getBarColor(item.rating) }}
                >
                  {item.rating}
                </div>
              </div>
              <div className="text-lg font-bold text-gray-900">{item.count}</div>
              <div className="text-xs font-medium text-gray-500">{item.percentage.toFixed(0)}%</div>
              <div className="text-xs text-gray-400">responses</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}