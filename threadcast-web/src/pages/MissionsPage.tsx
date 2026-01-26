import { useEffect, useState } from 'react';
import { useMissionStore, useUIStore, useToast } from '../stores';
import { MissionBoard } from '../components/mission/MissionBoard';
import { PageHeader } from '../components/layout/Header';
import { Modal } from '../components/feedback/Modal';
import { Input, TextArea } from '../components/form/Input';
import { Select } from '../components/form/Select';
import { Button } from '../components/common/Button';
import type { Mission, Priority } from '../types';

export function MissionsPage() {
  const { currentWorkspaceId } = useUIStore();
  const { missions, isLoading, fetchMissions, createMission } = useMissionStore();
  const toast = useToast();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newMission, setNewMission] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM' as Priority,
  });
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (currentWorkspaceId) {
      fetchMissions(currentWorkspaceId);
    }
  }, [currentWorkspaceId, fetchMissions]);

  const handleCreateMission = async () => {
    if (!currentWorkspaceId || !newMission.title.trim()) return;

    setIsCreating(true);
    try {
      await createMission({
        workspaceId: currentWorkspaceId,
        title: newMission.title,
        description: newMission.description || undefined,
        priority: newMission.priority,
      });
      toast.success('Mission Created', 'Your new mission has been created');
      setIsCreateModalOpen(false);
      setNewMission({ title: '', description: '', priority: 'MEDIUM' });
    } catch {
      toast.error('Failed', 'Could not create mission');
    } finally {
      setIsCreating(false);
    }
  };

  const handleMissionClick = (mission: Mission) => {
    // Navigate to mission detail or open panel
    console.log('Mission clicked:', mission.id);
  };

  return (
    <div className="h-full flex flex-col">
      <PageHeader
        title="Missions"
        description="Manage your development missions"
        actions={
          <Button onClick={() => setIsCreateModalOpen(true)}>
            New Mission
          </Button>
        }
      />

      <div className="flex-1 overflow-auto p-6">
        <MissionBoard
          missions={missions}
          onMissionClick={handleMissionClick}
          onAddMission={() => setIsCreateModalOpen(true)}
          isLoading={isLoading}
        />
      </div>

      {/* Create Mission Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Mission"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateMission}
              isLoading={isCreating}
              disabled={!newMission.title.trim()}
            >
              Create Mission
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Title"
            value={newMission.title}
            onChange={(e) => setNewMission({ ...newMission, title: e.target.value })}
            placeholder="e.g., User Authentication System"
            fullWidth
          />
          <TextArea
            label="Description"
            value={newMission.description}
            onChange={(e) => setNewMission({ ...newMission, description: e.target.value })}
            placeholder="Describe what this mission aims to achieve..."
            fullWidth
          />
          <Select
            label="Priority"
            value={newMission.priority}
            onChange={(e) => setNewMission({ ...newMission, priority: e.target.value as Priority })}
            options={[
              { value: 'CRITICAL', label: 'Critical' },
              { value: 'HIGH', label: 'High' },
              { value: 'MEDIUM', label: 'Medium' },
              { value: 'LOW', label: 'Low' },
            ]}
            fullWidth
          />
        </div>
      </Modal>
    </div>
  );
}
