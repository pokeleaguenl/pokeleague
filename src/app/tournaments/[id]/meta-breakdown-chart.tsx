"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface MetaData {
  deck: string;
  count: number;
  percentage: number;
}

interface MetaBreakdownChartProps {
  data: MetaData[];
}

const COLORS = [
  '#facc15', // yellow-400
  '#f97316', // orange-500
  '#ef4444', // red-500
  '#a855f7', // purple-500
  '#3b82f6', // blue-500
  '#22c55e', // green-500
  '#ec4899', // pink-500
  '#14b8a6', // teal-500
];

export default function MetaBreakdownChart({ data }: MetaBreakdownChartProps) {
  // Prepare data for pie chart
  const chartData = data.map((item, index) => ({
    name: item.deck.length > 20 ? item.deck.substring(0, 20) + '...' : item.deck,
    value: item.count,
    percentage: item.percentage,
    fullName: item.deck,
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-3">
          <p className="text-white font-medium text-sm">{data.fullName}</p>
          <p className="text-gray-400 text-xs mt-1">
            {data.value} entries ({data.percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div>
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="mt-4 space-y-1">
        {chartData.map((item, index) => (
          <div key={index} className="flex items-center gap-2 text-xs">
            <div
              className="w-3 h-3 rounded-sm flex-shrink-0"
              style={{ backgroundColor: COLORS[index % COLORS.length] }}
            />
            <span className="text-gray-400 truncate">{item.fullName}</span>
            <span className="text-gray-600 ml-auto">{item.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
