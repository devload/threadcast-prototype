import { clsx } from 'clsx';

export interface StatItem {
  label: string;
  value: string | number;
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'default';
}

interface StatsGridProps {
  stats: StatItem[];
  columns?: 2 | 3 | 4;
}

const colorStyles: Record<string, string> = {
  primary: 'text-indigo-600',
  success: 'text-green-600',
  warning: 'text-amber-500',
  danger: 'text-red-500',
  default: 'text-indigo-600',
};

export function StatsGrid({
  stats,
  columns = 2,
}: StatsGridProps) {
  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
  };

  return (
    <div className={clsx('grid gap-2', gridCols[columns])}>
      {stats.map((stat, index) => (
        <div
          key={index}
          className="bg-slate-50 rounded-md p-2.5 text-center"
        >
          <div
            className={clsx(
              'text-lg font-bold',
              colorStyles[stat.color || 'default']
            )}
          >
            {stat.value}
          </div>
          <div className="text-[10px] text-slate-500">{stat.label}</div>
        </div>
      ))}
    </div>
  );
}

// Preset for workspace overview stats
interface WorkspaceStatsProps {
  total: number;
  active: number;
  successRate: number;
  remainingTime?: string;
}

export function WorkspaceStats({
  total,
  active,
  successRate,
  remainingTime = '~0h',
}: WorkspaceStatsProps) {
  const stats: StatItem[] = [
    { label: 'Total', value: total },
    { label: 'Active', value: active },
    { label: 'Success', value: `${successRate}%` },
    { label: 'Remaining', value: remainingTime },
  ];

  return <StatsGrid stats={stats} columns={2} />;
}
