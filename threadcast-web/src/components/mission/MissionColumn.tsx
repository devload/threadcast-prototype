import { clsx } from 'clsx';
import { Plus } from 'lucide-react';
import type { Mission, MissionStatus } from '../../types';
import { MissionCard, MissionCardSkeleton } from './MissionCard';

interface MissionColumnProps {
  status: MissionStatus;
  missions: Mission[];
  onMissionClick?: (mission: Mission) => void;
  onAddClick?: () => void;
  selectedMissionId?: string;
  isLoading?: boolean;
}

const statusConfig: Record<MissionStatus, { label: string; color: string; bgColor: string }> = {
  BACKLOG: {
    label: 'Backlog',
    color: 'text-slate-600',
    bgColor: 'bg-slate-100',
  },
  PENDING: {
    label: 'Pending',
    color: 'text-slate-600',
    bgColor: 'bg-slate-100',
  },
  THREADING: {
    label: 'Threading',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
  },
  WOVEN: {
    label: 'Woven',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  COMPLETED: {
    label: 'Completed',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  TANGLED: {
    label: 'Tangled',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
  },
  ARCHIVED: {
    label: 'Archived',
    color: 'text-gray-500',
    bgColor: 'bg-gray-50',
  },
  SKIPPED: {
    label: 'Skipped',
    color: 'text-slate-500',
    bgColor: 'bg-slate-50',
  },
};

export function MissionColumn({
  status,
  missions,
  onMissionClick,
  onAddClick,
  selectedMissionId,
  isLoading = false,
}: MissionColumnProps) {
  const config = statusConfig[status];
  const count = missions.length;

  return (
    <div className="kanban-column">
      {/* Header */}
      <div className="kanban-column-header">
        <div className="flex items-center gap-2">
          <span className={clsx('font-medium', config.color)}>{config.label}</span>
          <span
            className={clsx(
              'px-2 py-0.5 text-xs font-medium rounded-full',
              config.bgColor,
              config.color
            )}
          >
            {count}
          </span>
        </div>
        {onAddClick && status === 'BACKLOG' && (
          <button
            onClick={onAddClick}
            className="p-1 hover:bg-slate-100 rounded transition-colors"
            title="Add Mission"
          >
            <Plus size={18} className="text-slate-400" />
          </button>
        )}
      </div>

      {/* Cards */}
      <div className="kanban-column-content">
        {isLoading ? (
          <>
            <MissionCardSkeleton />
            <MissionCardSkeleton />
          </>
        ) : missions.length > 0 ? (
          missions.map((mission) => (
            <MissionCard
              key={mission.id}
              mission={mission}
              onClick={() => onMissionClick?.(mission)}
              selected={mission.id === selectedMissionId}
            />
          ))
        ) : (
          <div className="text-center py-8 text-slate-400 text-sm">
            No missions
          </div>
        )}
      </div>
    </div>
  );
}
