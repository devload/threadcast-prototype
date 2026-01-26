import { clsx } from 'clsx';
import type { MissionStatus, TodoStatus, Priority, StepStatus } from '../../types';

interface StatusBadgeProps {
  status: MissionStatus | TodoStatus | StepStatus;
  size?: 'sm' | 'md';
}

const statusConfig: Record<string, { label: string; className: string }> = {
  BACKLOG: { label: 'Backlog', className: 'badge-backlog' },
  PENDING: { label: 'Pending', className: 'badge-pending' },
  THREADING: { label: 'Threading', className: 'badge-threading' },
  IN_PROGRESS: { label: 'In Progress', className: 'badge-threading' },
  WOVEN: { label: 'Woven', className: 'badge-woven' },
  COMPLETED: { label: 'Completed', className: 'badge-woven' },
  TANGLED: { label: 'Tangled', className: 'badge-tangled' },
  ARCHIVED: { label: 'Archived', className: 'badge-archived' },
  SKIPPED: { label: 'Skipped', className: 'bg-gray-100 text-gray-600' },
};

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const config = statusConfig[status] || { label: status, className: 'badge-backlog' };

  return (
    <span
      className={clsx(
        'badge',
        config.className,
        size === 'sm' && 'text-[10px] px-2 py-0.5'
      )}
    >
      {config.label}
    </span>
  );
}

interface PriorityBadgeProps {
  priority: Priority;
  showLabel?: boolean;
}

const priorityConfig: Record<Priority, { label: string; className: string; icon: string }> = {
  CRITICAL: { label: 'Critical', className: 'priority-critical', icon: '🔴' },
  HIGH: { label: 'High', className: 'priority-high', icon: '🟠' },
  MEDIUM: { label: 'Medium', className: 'priority-medium', icon: '🟡' },
  LOW: { label: 'Low', className: 'priority-low', icon: '🔵' },
};

export function PriorityBadge({ priority, showLabel = false }: PriorityBadgeProps) {
  const config = priorityConfig[priority];

  if (showLabel) {
    return (
      <span className={clsx('inline-flex items-center gap-1 text-sm font-medium', config.className)}>
        <span>{config.icon}</span>
        <span>{config.label}</span>
      </span>
    );
  }

  return (
    <span className="text-sm" title={config.label}>
      {config.icon}
    </span>
  );
}
