import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

export interface WeeklyActivityData {
  day: string;
  ai: number;
  user: number;
}

interface WeeklyActivityChartProps {
  data: WeeklyActivityData[];
  height?: number;
  showLegend?: boolean;
  title?: string;
}

const COLORS = {
  ai: '#8b5cf6',    // purple for AI
  user: '#6366f1',  // indigo for User
};

export const WeeklyActivityChart = ({
  data,
  height = 200,
  showLegend = true,
  title,
}: WeeklyActivityChartProps) => {
  // Safely process data - no useMemo needed for simple mapping
  const safeData = Array.isArray(data) ? data : [];
  const formattedData = safeData.map((item) => ({
    day: String(item?.day || ''),
    ai: Number(item?.ai) || 0,
    user: Number(item?.user) || 0,
    displayDay: String(item?.day || '').slice(0, 3),
  }));

  if (safeData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 text-sm">
        No activity data
      </div>
    );
  }

  return (
    <div className="w-full">
      {title && (
        <div className="text-sm font-semibold text-gray-900 mb-3">{title}</div>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={formattedData}
          margin={{ top: 5, right: 10, left: -10, bottom: 0 }}
          barCategoryGap="20%"
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
          <XAxis
            dataKey="displayDay"
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
            cursor={{ fill: '#f3f4f6' }}
          />
          {showLegend && (
            <Legend
              wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
              iconType="circle"
              iconSize={8}
            />
          )}
          <Bar
            dataKey="ai"
            name="AI Actions"
            fill={COLORS.ai}
            radius={[4, 4, 0, 0]}
            maxBarSize={32}
          />
          <Bar
            dataKey="user"
            name="User Actions"
            fill={COLORS.user}
            radius={[4, 4, 0, 0]}
            maxBarSize={32}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default WeeklyActivityChart;
