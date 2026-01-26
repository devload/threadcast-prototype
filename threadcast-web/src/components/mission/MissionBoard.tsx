import type { Mission, MissionStatus } from '../../types';
import { MissionColumn } from './MissionColumn';

interface MissionBoardProps {
  missions: Mission[];
  onMissionClick?: (mission: Mission) => void;
  onAddMission?: () => void;
  selectedMissionId?: string;
  isLoading?: boolean;
}

const statusOrder: MissionStatus[] = ['BACKLOG', 'THREADING', 'WOVEN'];

export function MissionBoard({
  missions,
  onMissionClick,
  onAddMission,
  selectedMissionId,
  isLoading = false,
}: MissionBoardProps) {
  // Group missions by status
  const missionsByStatus = statusOrder.reduce((acc, status) => {
    acc[status] = missions.filter((m) => m.status === status);
    return acc;
  }, {} as Record<MissionStatus, Mission[]>);

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
        />
      ))}
    </div>
  );
}
