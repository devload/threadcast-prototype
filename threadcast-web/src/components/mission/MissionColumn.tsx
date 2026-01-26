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
  aiQuestionsByMission?: Record<string, number>;
  // Drag and drop props
  onDragStart?: (mission: Mission) => void;
  onDragEnd?: () => void;
  onDragOver?: () => void;
  onDrop?: () => void;
  isDragOver?: boolean;
  draggedMissionId?: string;
}

const statusConfig: Record<MissionStatus, { label: string; icon: string; color: string; bgColor: string }> = {
  BACKLOG: {
    label: 'Backlog',
    icon: '📝',
    color: 'text-slate-600',
    bgColor: 'bg-slate-100',
  },
  PENDING: {
    label: 'Pending',
    icon: '📝',
    color: 'text-slate-600',
    bgColor: 'bg-slate-100',
  },
  THREADING: {
    label: 'Threading',
    icon: '🧵',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    icon: '🧵',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
  },
  WOVEN: {
    label: 'Woven',
    icon: '✅',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  COMPLETED: {
    label: 'Completed',
    icon: '✅',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  TANGLED: {
    label: 'Tangled',
    icon: '❌',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
  },
  ARCHIVED: {
    label: 'Archived',
    icon: '📦',
    color: 'text-gray-500',
    bgColor: 'bg-gray-50',
  },
  SKIPPED: {
    label: 'Skipped',
    icon: '⏭️',
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
  aiQuestionsByMission = {},
  // Drag and drop
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  isDragOver = false,
  draggedMissionId,
}: MissionColumnProps) {
  const config = statusConfig[status];
  const count = missions.length;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    onDragOver?.();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    onDrop?.();
  };

  return (
    <div
      className={`kanban-column drop-target ${isDragOver ? 'drag-over' : ''}`}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Header */}
      <div className="kanban-column-header">
        <div className="kanban-column-title">
          <span>{config.icon}</span>
          <span className={config.color}>{config.label}</span>
          <span className="kanban-column-count">{count}</span>
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
              draggable={!!onDragStart}
              isDragging={mission.id === draggedMissionId}
              onDragStart={(e) => {
                e.dataTransfer.effectAllowed = 'move';
                onDragStart?.(mission);
              }}
              onDragEnd={() => onDragEnd?.()}
              aiQuestionCount={aiQuestionsByMission[mission.id] || 0}
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
