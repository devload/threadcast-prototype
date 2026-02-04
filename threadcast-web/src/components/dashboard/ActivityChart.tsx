import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

export interface ActivityDataPoint {
  date: string;
  commits: number;
  aiActions: number;
  todosCompleted: number;
}

interface ActivityChartProps {
  data: ActivityDataPoint[];
  height?: number;
  showLegend?: boolean;
  title?: string;
}

const COLORS = {
  commits: '#6366f1',      // indigo
  aiActions: '#8b5cf6',    // purple
  todosCompleted: '#22c55e', // green
};

export const ActivityChart = ({
  data,
  height = 200,
  showLegend = true,
  title,
}: ActivityChartProps) => {
  const formattedData = useMemo(() => {
    return data.map((item) => ({
      ...item,
      displayDate: formatDate(item.date),
    }));
  }, [data]);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 text-sm">
        No activity data available
      </div>
    );
  }

  return (
    <div className="w-full">
      {title && (
        <div className="text-sm font-semibold text-gray-900 mb-3">{title}</div>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart
          data={formattedData}
          margin={{ top: 5, right: 10, left: -10, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorCommits" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLORS.commits} stopOpacity={0.3} />
              <stop offset="95%" stopColor={COLORS.commits} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorAiActions" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLORS.aiActions} stopOpacity={0.3} />
              <stop offset="95%" stopColor={COLORS.aiActions} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorTodos" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLORS.todosCompleted} stopOpacity={0.3} />
              <stop offset="95%" stopColor={COLORS.todosCompleted} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
          <XAxis
            dataKey="displayDate"
            tick={{ fontSize: 10, fill: '#9ca3af' }}
            tickLine={false}
            axisLine={{ stroke: '#e5e7eb' }}
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#9ca3af' }}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '12px',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            }}
            labelStyle={{ fontWeight: 600, marginBottom: 4 }}
          />
          {showLegend && (
            <Legend
              wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
              iconType="circle"
              iconSize={8}
            />
          )}
          <Area
            type="monotone"
            dataKey="commits"
            name="Commits"
            stroke={COLORS.commits}
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorCommits)"
          />
          <Area
            type="monotone"
            dataKey="aiActions"
            name="AI Actions"
            stroke={COLORS.aiActions}
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorAiActions)"
          />
          <Area
            type="monotone"
            dataKey="todosCompleted"
            name="Todos Done"
            stroke={COLORS.todosCompleted}
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorTodos)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${month}/${day}`;
}

export default ActivityChart;
