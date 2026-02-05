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
  // Safely extract values to prevent object comparison issues
  const pending = Number(data?.pending) || 0;
  const threading = Number(data?.threading) || 0;
  const woven = Number(data?.woven) || 0;
  const tangled = Number(data?.tangled) || 0;

  const chartData = useMemo(() => {
    const items = [
      { key: 'pending', value: pending },
      { key: 'threading', value: threading },
      { key: 'woven', value: woven },
      { key: 'tangled', value: tangled },
    ];
    return items
      .filter((item) => item.value > 0)
      .map((item) => ({
        name: STATUS_CONFIG[item.key as keyof TodoStatusData]?.label || item.key,
        value: item.value,
        color: STATUS_CONFIG[item.key as keyof TodoStatusData]?.color || '#6b7280',
      }));
  }, [pending, threading, woven, tangled]);

  const total = useMemo(() => {
    return pending + threading + woven + tangled;
  }, [pending, threading, woven, tangled]);

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
