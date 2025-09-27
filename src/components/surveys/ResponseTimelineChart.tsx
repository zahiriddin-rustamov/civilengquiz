'use client';

import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { format, parseISO, startOfDay, subDays, eachDayOfInterval } from 'date-fns';

interface ResponseTimelineChartProps {
  responses: Array<{
    completedAt: Date | string;
  }>;
  className?: string;
  days?: number; // Number of days to show (default: 7)
}

export function ResponseTimelineChart({
  responses,
  className = "",
  days = 7
}: ResponseTimelineChartProps) {
  // Generate chart data for the last N days
  const endDate = new Date();
  const startDate = subDays(endDate, days - 1);

  const dateRange = eachDayOfInterval({ start: startDate, end: endDate });

  const chartData = dateRange.map(date => {
    const dateKey = format(date, 'yyyy-MM-dd');
    const dayResponses = responses.filter(response => {
      const responseDate = typeof response.completedAt === 'string'
        ? parseISO(response.completedAt)
        : response.completedAt;
      return format(startOfDay(responseDate), 'yyyy-MM-dd') === dateKey;
    });

    return {
      date: dateKey,
      displayDate: format(date, 'MMM dd'),
      count: dayResponses.length,
      responses: dayResponses.length
    };
  });

  const chartConfig = {
    responses: {
      label: 'Responses'
    }
  };

  const totalResponses = responses.length;
  const avgResponsesPerDay = totalResponses / days;

  if (totalResponses === 0) {
    return (
      <div className={`flex items-center justify-center h-48 text-gray-500 ${className}`}>
        No responses in the last {days} days
      </div>
    );
  }

  return (
    <div className={`${className} bg-gradient-to-br from-blue-50 to-indigo-50/50 rounded-lg p-4 border border-blue-200/50`}>
      {/* Chart with enhanced styling */}
      <div className="bg-white rounded-lg p-4 shadow-sm border border-blue-100/50 mb-4">
        <ChartContainer config={chartConfig} className="h-52">
          <LineChart data={chartData} margin={{ top: 15, right: 15, left: 5, bottom: 5 }}>
            <defs>
              <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis
              dataKey="displayDate"
              axisLine={false}
              tickLine={false}
              fontSize={11}
              tick={{ fill: '#64748b' }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              fontSize={11}
              tick={{ fill: '#64748b' }}
              width={25}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, name) => [`${value} responses`, 'Count']}
                  labelFormatter={(label) => {
                    const item = chartData.find(d => d.displayDate === label);
                    return item ? format(parseISO(item.date), 'EEEE, MMM dd, yyyy') : label;
                  }}
                />
              }
            />
            <Line
              type="monotone"
              dataKey="count"
              stroke="#3b82f6"
              strokeWidth={3}
              dot={{ r: 5, fill: "#3b82f6", stroke: "#ffffff", strokeWidth: 2 }}
              activeDot={{ r: 7, fill: "#1d4ed8", stroke: "#ffffff", strokeWidth: 2 }}
              fill="url(#colorGradient)"
            />
          </LineChart>
        </ChartContainer>
      </div>

      {/* Last 7 days activity summary */}
      <div className="bg-white/70 backdrop-blur-sm rounded-lg border border-white/50 p-3">
        <div className="text-xs font-medium text-blue-700 mb-2">Last 7 days activity</div>
        <div className="grid grid-cols-7 gap-1">
          {chartData.slice(-7).map((day, index) => (
            <div key={day.date} className="text-center">
              <div className="text-xs text-blue-600 mb-1">
                {format(parseISO(day.date), 'EEE')}
              </div>
              <div className={`w-full h-8 rounded flex items-center justify-center text-xs font-medium ${
                day.count === 0
                  ? 'bg-gray-100 text-gray-400'
                  : 'bg-blue-100 text-blue-700'
              }`}>
                {day.count}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}