import { useState, useCallback } from 'react';
import type { Mission, MissionStatus } from '../../types';
import { MissionColumn } from './MissionColumn';

interface MissionBoardProps {
  missions: Mission[];
  onMissionClick?: (mission: Mission) => void;
  onAddMission?: () => void;
  onMissionStatusChange?: (missionId: string, newStatus: MissionStatus) => void;
  selectedMissionId?: string;
  isLoading?: boolean;
  aiQuestionsByMission?: Record<string, number>;
}

const statusOrder: MissionStatus[] = ['BACKLOG', 'THREADING', 'WOVEN', 'DROPPED', 'ARCHIVED'];

export function MissionBoard({
  missions = [],
  onMissionClick,
  onAddMission,
  onMissionStatusChange,
  selectedMissionId,
  isLoading = false,
  aiQuestionsByMission = {},
}: MissionBoardProps) {
  const [draggedMission, setDraggedMission] = useState<Mission | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<MissionStatus | null>(null);

  // Group missions by status (with safe fallback)
  const safeMissions = missions || [];
  const missionsByStatus = statusOrder.reduce((acc, status) => {
    acc[status] = safeMissions.filter((m) => m.status === status);
    return acc;
  }, {} as Record<MissionStatus, Mission[]>);

  const handleDragStart = useCallback((mission: Mission) => {
    setDraggedMission(mission);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedMission(null);
    setDragOverStatus(null);
  }, []);

  const handleDragOver = useCallback((status: MissionStatus) => {
    setDragOverStatus(status);
  }, []);

  const handleDrop = useCallback((targetStatus: MissionStatus) => {
    if (draggedMission && draggedMission.status !== targetStatus && onMissionStatusChange) {
      onMissionStatusChange(draggedMission.id, targetStatus);
    }
    setDraggedMission(null);
    setDragOverStatus(null);
  }, [draggedMission, onMissionStatusChange]);

  return (
    <div className="kanban-board">
      {statusOrder.map((status) => (
        <MissionColumn
          key={status}
          status={status}
          missions={missionsByStatus[status]}
          onMissionClick={onMissionClick}
          onAddClick={status === 'BACKLOG' ? onAddMission : undefined}
          selectedMissionId={selectedMissionId}
          isLoading={isLoading}
          aiQuestionsByMission={aiQuestionsByMission || {}}
          // Drag and drop props
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragOver={() => handleDragOver(status)}
          onDrop={() => handleDrop(status)}
          isDragOver={dragOverStatus === status}
          draggedMissionId={draggedMission?.id}
        />
      ))}
    </div>
  );
}
