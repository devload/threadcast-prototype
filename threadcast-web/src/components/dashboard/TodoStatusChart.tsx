import { useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';

export interface TodoStatusData {
  pending: number;
  threading: number;
  woven: number;
  tangled: number;
}

interface TodoStatusChartProps {
  data: TodoStatusData;
  height?: number;
  showLegend?: boolean;
  title?: string;
  variant?: 'pie' | 'donut';
}

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: '#9ca3af' },
  threading: { label: 'Threading', color: '#f59e0b' },
  woven: { label: 'Woven', color: '#22c55e' },
  tangled: { label: 'Tangled', color: '#ef4444' },
};

export const TodoStatusChart = ({
  data,
  height = 200,
  showLegend = true,
  title,
  variant = 'donut',
}: TodoStatusChartProps) => {
  const chartData = useMemo(() => {
    return Object.entries(data)
      .filter(([_, value]) => value > 0)
      .map(([key, value]) => ({
        name: STATUS_CONFIG[key as keyof TodoStatusData]?.label || key,
        value,
        color: STATUS_CONFIG[key as keyof TodoStatusData]?.color || '#6b7280',
      }));
  }, [data]);

  const total = useMemo(() => {
    return Object.values(data).reduce((sum, val) => sum + val, 0);
  }, [data]);

  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 text-sm">
        No todos yet
      </div>
    );
  }

  const innerRadius = variant === 'donut' ? 45 : 0;

  return (
    <div className="w-full">
      {title && (
        <div className="text-sm font-semibold text-gray-900 mb-3">{title}</div>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={70}
            paddingAngle={2}
            dataKey="value"
            strokeWidth={0}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '12px',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            }}
            formatter={(value, name) => {
              const numValue = typeof value === 'number' ? value : 0;
              return [`${numValue} (${Math.round((numValue / total) * 100)}%)`, name];
            }}
          />
          {showLegend && (
            <Legend
              layout="vertical"
              align="right"
              verticalAlign="middle"
              wrapperStyle={{ fontSize: '11px', paddingLeft: '8px' }}
              iconType="circle"
              iconSize={8}
              formatter={(value) => (
                <span style={{ color: '#374151' }}>{value}</span>
              )}
            />
          )}
        </PieChart>
      </ResponsiveContainer>
      {variant === 'donut' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{total}</div>
            <div className="text-[10px] text-gray-500">Total</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TodoStatusChart;
